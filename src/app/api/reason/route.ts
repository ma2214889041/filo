import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, MODEL_ID } from "@/lib/gemini";
import { CentorCriteriaSchema } from "@/lib/schemas";
import { calculateMcIsaac } from "@/lib/centor";
import { ANTIBIOTICS } from "@/data/antibiotics";
import { z } from "zod/v4";
import { Type } from "@google/genai";

const ReasonRequestSchema = z.object({
  criteria: CentorCriteriaSchema,
  patientContext: z.object({
    name: z.string(),
    age: z.number(),
    sex: z.string(),
    symptoms: z.string(),
    temperature: z.number(),
    daysSick: z.number(),
  }),
});

// Step C 的 LLM 系统提示：只生成摘要，不做决策
const SYSTEM_PROMPT = `You are a clinical summarization assistant for Italian general practitioners evaluating acute pharyngitis.

Your ONLY task: generate a concise 2-sentence clinical summary in plain language for the GP, based on the McIsaac score, management band, and patient context provided.

CRITICAL WORDING RULES:
- Never say "I recommend" or "the patient should receive antibiotics"
- Never make management decisions — those are already determined by the deterministic scoring system
- Use language like: "Guideline-matched options for GP consideration are listed below."
- Always include the phrase: "Confirmatory testing recommended where available."
- Simply summarize the clinical picture. The deterministic system has already mapped score → management.`;

const summaryResponseSchema = {
  type: Type.OBJECT,
  properties: {
    clinicalSummary: {
      type: Type.STRING,
      description: "A concise 2-sentence clinical summary for the GP in plain language",
    },
  },
  required: ["clinicalSummary"],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ReasonRequestSchema.parse(body);

    // Step A: 确定性 McIsaac 评分计算
    // Step B: 确定性管理映射（都在 calculateMcIsaac 内完成）
    const mcIsaac = calculateMcIsaac(parsed.criteria);

    // Step C: LLM 仅生成 2 句临床摘要（不做决策）
    const ai = await getGeminiClient();

    const userPrompt = `Patient: ${parsed.patientContext.name}, ${parsed.patientContext.age}${parsed.patientContext.sex}, presenting with acute pharyngitis.
Symptoms: ${parsed.patientContext.symptoms}
Temperature: ${parsed.patientContext.temperature}°C, Duration: ${parsed.patientContext.daysSick} days

McIsaac Score: ${mcIsaac.score}/5
Score Breakdown:
- Tonsillar exudate: ${parsed.criteria.tonsillar_exudate} (${mcIsaac.breakdown.tonsillarExudate} point)
- Tender anterior cervical nodes: ${parsed.criteria.tender_anterior_cervical_nodes} (${mcIsaac.breakdown.tenderNodes} point)
- Fever >38°C: ${parsed.criteria.fever_over_38} (${mcIsaac.breakdown.fever} point)
- Absence of cough: ${parsed.criteria.absence_of_cough} (${mcIsaac.breakdown.absenceOfCough} point)
- Age band: ${parsed.criteria.age_band} (modifier: ${mcIsaac.breakdown.ageModifier >= 0 ? "+" : ""}${mcIsaac.breakdown.ageModifier})

GAS Probability: ${mcIsaac.gasProbability}
Management Band: ${mcIsaac.managementBand}
Management Advice: ${mcIsaac.managementAdvice}

Generate a 2-sentence clinical summary. Do NOT repeat the management advice — that is shown separately. Focus on summarizing the clinical picture.`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: summaryResponseSchema,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    const text = response.text ?? "";
    const llmOutput = JSON.parse(text);

    // 抗生素选项——仅在评分 ≥2 时才有意义，但总是返回给前端，由 UI 根据 managementBand 决定是否显示
    const guidelineMatchedOptions = ANTIBIOTICS.map((ab) => ({
      drugId: ab.id,
      drugName: ab.name,
      dose: ab.dose,
      duration: ab.duration,
      rationale: ab.description,
    }));

    return NextResponse.json({
      // Step A 输出
      score: mcIsaac.score,
      breakdown: mcIsaac.breakdown,
      // Step B 输出（确定性）
      managementBand: mcIsaac.managementBand,
      managementAdvice: mcIsaac.managementAdvice,
      gasProbability: mcIsaac.gasProbability,
      // Step C 输出（LLM）
      clinicalSummary: llmOutput.clinicalSummary,
      // 硬编码选项
      guidelineMatchedOptions,
    });
  } catch (error) {
    console.error("Reason API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
