import { NextRequest, NextResponse } from "next/server";
import { kvPut } from "@/lib/kv";
import { z } from "zod/v4";

const PrescribeRequestSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  drugId: z.string(),
  drugName: z.string(),
  dose: z.string(),
  duration: z.string(),
  centorScore: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PrescribeRequestSchema.parse(body);

    const prescription = {
      ...parsed,
      prescribedAt: new Date().toISOString(),
    };

    // 保存处方到 KV
    await kvPut(`prescription:${parsed.patientId}`, prescription);

    return NextResponse.json({ success: true, prescription });
  } catch (error) {
    console.error("Prescribe API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
