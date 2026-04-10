import { NextRequest } from "next/server";
import { getGeminiClient, MODEL_ID } from "@/lib/gemini";
import { kvGet, kvPut, kvAppend } from "@/lib/kv";
import { getGuidelineByDrugId } from "@/data/guidelines";
import { AdherenceRequestSchema } from "@/lib/schemas";
import type { Prescription, GpAlert } from "@/lib/schemas";
import type { Content, FunctionDeclaration, Part } from "@google/genai";
import { Type } from "@google/genai";

const SYSTEM_PROMPT = `You are an AI adherence support agent for patients taking antibiotics prescribed by their GP. You communicate in Italian with the patient.

Your role:
1. Answer patient questions about their medication
2. Encourage completion of the full antibiotic course
3. Identify potential adverse reactions and escalate to the GP when needed

CRITICAL RULES:
- If a patient mentions a RASH, skin spots, hives, swelling, or difficulty breathing: you MUST call escalate_to_gp immediately with high urgency. These are potential allergic reactions.
- If a patient wants to stop medication early because they feel better: firmly but kindly explain why completing the full course is essential. Do NOT escalate unless there are concerning symptoms.
- If a patient forgot a dose: look up the guideline for their medication and provide specific advice.
- Always call reply_to_patient with your final message to the patient.
- You may call multiple tools before replying.

ESCALATION RULES:
- Rash/skin reaction → escalate with urgency "high"
- Worsening symptoms after 48h → escalate with urgency "high"
- Mild side effects (nausea, diarrhea) → reassure, no escalation unless severe
- Forgot a dose → advise, no escalation
- Wants to stop early → counsel, no escalation

You MUST respond in Italian to the patient.`;

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: "get_patient_prescription",
    description: "Retrieve the current prescription for a patient from the medical records",
    parameters: {
      type: Type.OBJECT,
      properties: {
        patient_id: { type: Type.STRING, description: "The patient ID" },
      },
      required: ["patient_id"],
    },
  },
  {
    name: "get_antibiotic_guideline",
    description: "Look up clinical guidelines for a specific antibiotic drug including dosage, side effects, and allergy information",
    parameters: {
      type: Type.OBJECT,
      properties: {
        drug_id: { type: Type.STRING, description: "The drug identifier (e.g. amoxicillin, penicillin-v, azithromycin)" },
      },
      required: ["drug_id"],
    },
  },
  {
    name: "escalate_to_gp",
    description: "Send an urgent alert to the GP about a patient concern that requires medical attention",
    parameters: {
      type: Type.OBJECT,
      properties: {
        patient_id: { type: Type.STRING, description: "The patient ID" },
        reason: { type: Type.STRING, description: "Reason for escalation" },
        urgency: { type: Type.STRING, enum: ["low", "medium", "high"], description: "Urgency level" },
      },
      required: ["patient_id", "reason", "urgency"],
    },
  },
  {
    name: "reply_to_patient",
    description: "Send a reply message to the patient. This should be called as the final action.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        patient_id: { type: Type.STRING, description: "The patient ID" },
        message: { type: Type.STRING, description: "The reply message in Italian" },
      },
      required: ["patient_id", "message"],
    },
  },
];

// 执行工具调用
async function executeTool(
  name: string,
  args: Record<string, string>
): Promise<{ result: string; escalated?: boolean; replyMessage?: string }> {
  switch (name) {
    case "get_patient_prescription": {
      const prescription = await kvGet<Prescription>(`prescription:${args.patient_id}`);
      if (!prescription) {
        return { result: JSON.stringify({ error: "No prescription found for this patient" }) };
      }
      return { result: JSON.stringify(prescription) };
    }

    case "get_antibiotic_guideline": {
      const guideline = getGuidelineByDrugId(args.drug_id);
      if (!guideline) {
        return { result: JSON.stringify({ error: `No guideline found for drug: ${args.drug_id}` }) };
      }
      return { result: JSON.stringify(guideline) };
    }

    case "escalate_to_gp": {
      const alert: GpAlert = {
        patientId: args.patient_id,
        reason: args.reason,
        urgency: args.urgency as GpAlert["urgency"],
        timestamp: new Date().toISOString(),
      };
      await kvAppend(`alerts:${args.patient_id}`, alert);
      return {
        result: JSON.stringify({ success: true, message: "GP has been alerted" }),
        escalated: true,
      };
    }

    case "reply_to_patient": {
      await kvAppend(`messages:${args.patient_id}`, {
        role: "agent",
        content: args.message,
        timestamp: new Date().toISOString(),
      });
      return {
        result: JSON.stringify({ success: true }),
        replyMessage: args.message,
      };
    }

    default:
      return { result: JSON.stringify({ error: `Unknown tool: ${name}` }) };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = AdherenceRequestSchema.parse(body);

    // 保存患者消息到 KV
    await kvAppend(`messages:${parsed.patientId}`, {
      role: "patient",
      content: parsed.message,
      timestamp: new Date().toISOString(),
    });

    const ai = getGeminiClient();

    // SSE 流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        function sendEvent(type: string, data: unknown) {
          const payload = JSON.stringify({ type, data });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        }

        try {
          sendEvent("thinking", { message: "Analyzing patient message..." });

          // 构建初始对话
          const contents: Content[] = [
            {
              role: "user",
              parts: [
                {
                  text: `Patient ID: ${parsed.patientId}\nPatient message: "${parsed.message}"`,
                },
              ],
            },
          ];

          let loopCount = 0;
          const maxLoops = 10;

          while (loopCount < maxLoops) {
            loopCount++;

            const response = await ai.models.generateContent({
              model: MODEL_ID,
              contents,
              config: {
                systemInstruction: SYSTEM_PROMPT,
                tools: [{ functionDeclarations: toolDeclarations }],
                thinkingConfig: { thinkingBudget: 8192 },
              },
            });

            const candidate = response.candidates?.[0];
            if (!candidate?.content?.parts) break;

            const parts = candidate.content.parts;

            // 检查是否有函数调用
            const functionCalls = parts.filter(
              (p): p is Part & { functionCall: NonNullable<Part["functionCall"]> } =>
                !!p.functionCall
            );

            if (functionCalls.length === 0) {
              // 没有函数调用 = Agent 完成
              const textPart = parts.find((p) => p.text);
              if (textPart?.text) {
                sendEvent("agent_reply", { message: textPart.text });
              }
              break;
            }

            // 添加 model 的响应到对话
            contents.push({
              role: "model",
              parts: candidate.content.parts,
            });

            // 执行每个函数调用
            const functionResponses: Part[] = [];
            for (const fc of functionCalls) {
              const fnName = fc.functionCall.name!;
              const fnArgs = (fc.functionCall.args ?? {}) as Record<string, string>;
              sendEvent("tool_call", {
                tool: fnName,
                args: fnArgs,
              });

              const toolResult = await executeTool(fnName, fnArgs);

              sendEvent("tool_result", {
                tool: fnName,
                result: toolResult.result,
                escalated: toolResult.escalated,
              });

              if (toolResult.escalated) {
                sendEvent("escalation", {
                  reason: fnArgs.reason,
                  urgency: fnArgs.urgency,
                });
              }

              if (toolResult.replyMessage) {
                sendEvent("agent_reply", { message: toolResult.replyMessage });
              }

              functionResponses.push({
                functionResponse: {
                  name: fnName,
                  response: { result: toolResult.result },
                },
              });
            }

            // 添加函数调用结果
            contents.push({
              role: "user",
              parts: functionResponses,
            });
          }

          sendEvent("done", {});
        } catch (error) {
          sendEvent("error", {
            message: error instanceof Error ? error.message : "Internal error",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Adherence API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
