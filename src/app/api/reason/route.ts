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

const SYSTEM_PROMPT = `You are a clinical decision support system for Italian general practitioners evaluating acute pharyngitis.

Given a McIsaac/Centor score and patient context, generate:
1. A concise 2-sentence clinical summary for the GP
2. A qualitative probability assessment: "likely viral", "uncertain", or "likely bacterial"

CRITICAL RULES:
- You must NEVER say "I recommend", "I suggest", or any directive language.
- Instead, use language like: "Guideline-matched options for this presentation include..."
- You are surfacing options, NOT making decisions. The clinical decision remains with the physician.
- Base the probability on the McIsaac score: 0-1 = likely viral, 2-3 = uncertain, 4-5 = likely bacterial.
- The clinical summary should reference the score and key findings.`;

const reasoningResponseSchema = {
  type: Type.OBJECT,
  properties: {
    clinicalSummary: { type: Type.STRING },
    probability: {
      type: Type.STRING,
      enum: ["likely viral", "uncertain", "likely bacterial"],
    },
  },
  required: ["clinicalSummary", "probability"],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ReasonRequestSchema.parse(body);

    // Step A: 确定性 McIsaac 评分计算
    const mcIsaac = calculateMcIsaac(parsed.criteria);

    // Step B: LLM 生成临床摘要
    const ai = await getGeminiClient();

    const userPrompt = `Patient: ${parsed.patientContext.name}, ${parsed.patientContext.age}${parsed.patientContext.sex}, presenting with acute pharyngitis.
Symptoms: ${parsed.patientContext.symptoms}
Temperature: ${parsed.patientContext.temperature}°C, Duration: ${parsed.patientContext.daysSick} days

Centor/McIsaac Score: ${mcIsaac.score}/5
Score Breakdown:
- Tonsillar exudate: ${parsed.criteria.tonsillar_exudate}
- Tender anterior cervical nodes: ${parsed.criteria.tender_anterior_cervical_nodes}
- Fever >38°C: ${parsed.criteria.fever_over_38}
- Absence of cough: ${parsed.criteria.absence_of_cough}
- Age band: ${parsed.criteria.age_band} (modifier: ${mcIsaac.breakdown.ageModifier >= 0 ? "+" : ""}${mcIsaac.breakdown.ageModifier})

Interpretation: ${mcIsaac.interpretationDetail}

Generate a clinical summary and probability assessment.`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: reasoningResponseSchema,
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    const text = response.text ?? "";
    const llmOutput = JSON.parse(text);

    // 构建抗生素选项（使用硬编码数据 + 评分上下文）
    const guidelineMatchedOptions = ANTIBIOTICS.map((ab) => ({
      drugId: ab.id,
      drugName: ab.name,
      dose: ab.dose,
      duration: ab.duration,
      rationale: ab.description,
    }));

    return NextResponse.json({
      score: mcIsaac.score,
      breakdown: mcIsaac.breakdown,
      interpretation: mcIsaac.interpretation,
      interpretationDetail: mcIsaac.interpretationDetail,
      clinicalSummary: llmOutput.clinicalSummary,
      probability: llmOutput.probability,
      guidelineMatchedOptions,
    });
  } catch (error) {
    console.error("Reason API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
