import { NextRequest, NextResponse } from "next/server";
import { kvAppend } from "@/lib/kv";
import type { GpAlert } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, reason, urgency, details } = body;

    const alert: GpAlert = {
      patientId,
      reason: details ? `${reason}: ${details}` : reason,
      urgency: urgency || "high",
      timestamp: new Date().toISOString(),
    };

    await kvAppend(`alerts:${patientId}`, alert);

    return NextResponse.json({ success: true, alert });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Escalation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
