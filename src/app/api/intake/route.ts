import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, MODEL_ID } from "@/lib/gemini";
import { IntakeRequestSchema } from "@/lib/schemas";
import { Type } from "@google/genai";

const SYSTEM_PROMPT = `You are a medical intake assistant. Your task is to extract the 5 Centor criteria from patient-reported symptoms.

Given patient symptoms (free text) and structured data (temperature, days sick, age), extract:
1. tonsillar_exudate: true if patient mentions tonsillar exudate/pus/white patches on tonsils, false if explicitly denied, "unknown" if not mentioned
2. tender_anterior_cervical_nodes: true if patient mentions swollen/tender neck lymph nodes, false if explicitly denied, "unknown" if not mentioned
3. fever_over_38: true if temperature >= 38.0°C OR patient mentions high fever, false if temperature < 38.0°C, "unknown" if no temperature data
4. absence_of_cough: true if patient explicitly says NO cough or doesn't mention cough at all when describing throat symptoms, false if patient mentions having a cough, "unknown" only if ambiguous
5. age_band: "3-14" if age 3-14, "15-44" if age 15-44, "45+" if age 45 or older

CRITICAL RULES:
- If a criterion is NOT mentioned or cannot be determined, mark it as "unknown" — do NOT infer or guess.
- Use the structured temperature field to determine fever_over_38 when available.
- Use the structured age field to determine age_band.
- The symptom text may be in Italian — interpret accordingly.`;

// Gemini 结构化输出 schema
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    tonsillar_exudate: {
      type: Type.STRING,
      enum: ["true", "false", "unknown"],
    },
    tender_anterior_cervical_nodes: {
      type: Type.STRING,
      enum: ["true", "false", "unknown"],
    },
    fever_over_38: {
      type: Type.STRING,
      enum: ["true", "false", "unknown"],
    },
    absence_of_cough: {
      type: Type.STRING,
      enum: ["true", "false", "unknown"],
    },
    age_band: {
      type: Type.STRING,
      enum: ["3-14", "15-44", "45+"],
    },
  },
  required: [
    "tonsillar_exudate",
    "tender_anterior_cervical_nodes",
    "fever_over_38",
    "absence_of_cough",
    "age_band",
  ],
};

function parseBoolOrUnknown(val: string): boolean | "unknown" {
  if (val === "true") return true;
  if (val === "false") return false;
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = IntakeRequestSchema.parse(body);

    const ai = getGeminiClient();

    const userPrompt = `Patient information:
- Name: ${parsed.patientName || "Unknown"}
- Age: ${parsed.age} years old
- Temperature: ${parsed.temperature}°C
- Days sick: ${parsed.daysSick}
- Symptom description: "${parsed.symptoms}"

Extract the 5 Centor criteria as structured JSON.`;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text ?? "";
    const raw = JSON.parse(text);

    const criteria = {
      tonsillar_exudate: parseBoolOrUnknown(raw.tonsillar_exudate),
      tender_anterior_cervical_nodes: parseBoolOrUnknown(raw.tender_anterior_cervical_nodes),
      fever_over_38: parseBoolOrUnknown(raw.fever_over_38),
      absence_of_cough: parseBoolOrUnknown(raw.absence_of_cough),
      age_band: raw.age_band as "3-14" | "15-44" | "45+",
    };

    return NextResponse.json({ criteria });
  } catch (error) {
    console.error("Intake API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
