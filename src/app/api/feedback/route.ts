import { NextRequest, NextResponse } from "next/server";
import { kvPut } from "@/lib/kv";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, rating, comment, completedDays, totalDays } = body;

    const feedback = {
      patientId,
      rating,
      comment,
      completedDays,
      totalDays,
      submittedAt: new Date().toISOString(),
    };

    await kvPut(`feedback:${patientId}`, feedback);

    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Feedback failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
