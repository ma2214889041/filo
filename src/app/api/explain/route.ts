import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, MODEL_ID } from "@/lib/gemini";

const SYSTEM_PROMPT = `You are a clinical education assistant helping Italian general practitioners understand the Centor/McIsaac scoring system for acute pharyngitis.

Given the patient's criteria selections, computed McIsaac score, and optionally an uploaded clinical image, provide a clear, educational explanation in Italian.

Your response should:
1. Explain how each selected criterion contributes to the score
2. Interpret the GAS (Group A Streptococcus) probability for this score level
3. Explain the recommended management pathway based on current IDSA/ESCMID guidelines
4. If an image is provided, comment on any visible clinical findings relevant to the Centor criteria (e.g., tonsillar exudate, pharyngeal erythema)
5. Mention important caveats (e.g., score applies only to acute pharyngitis ≤3 days onset, score does not replace clinical judgment)

CRITICAL RULES:
- Never make a diagnosis. Use language like "il punteggio suggerisce..." or "le linee guida indicano..."
- Never prescribe. Say "le opzioni terapeutiche da valutare includono..."
- Always note that confirmatory testing (RADT/coltura) is recommended
- Keep the explanation concise but thorough (3-5 paragraphs)
- Write entirely in Italian`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { criteria, score, probability, managementBand, image } = body;

    const ai = await getGeminiClient();

    const criteriaDescription = [
      `Età: ${criteria.age_band} (${criteria.age_band === "3-14" ? "+1" : criteria.age_band === "45+" ? "-1" : "0"} punto)`,
      `Essudato tonsillare: ${criteria.tonsillar_exudate ? "Sì (+1)" : "No (0)"}`,
      `Linfonodi cervicali dolenti: ${criteria.tender_anterior_cervical_nodes ? "Sì (+1)" : "No (0)"}`,
      `Febbre >38°C: ${criteria.fever_over_38 ? "Sì (+1)" : "No (0)"}`,
      `Assenza di tosse: ${criteria.absence_of_cough ? "Sì (+1)" : "No (0)"}`,
    ].join("\n");

    const userText = `Criteri selezionati dal paziente:
${criteriaDescription}

Punteggio McIsaac calcolato: ${score}/5
Probabilità GAS stimata: ${probability}
Fascia di gestione: ${managementBand}

${image ? "Un'immagine clinica è stata allegata. Analizza eventuali segni visibili rilevanti per i criteri Centor." : ""}

Fornisci una spiegazione clinica educativa completa in italiano.`;

    // Build content parts
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: userText },
    ];

    if (image) {
      const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        thinkingConfig: { thinkingBudget: 2048 },
      },
    });

    const explanation = response.text ?? "";

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain API error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
