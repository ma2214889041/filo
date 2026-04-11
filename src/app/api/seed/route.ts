import { NextResponse } from "next/server";
import { kvPut } from "@/lib/kv";
import { DEMO_PATIENT } from "@/data/demo-patient";

/**
 * 演示数据 seed — 确保 KV 中有 Marta 的处方记录
 * followup 页面加载时自动调用
 */
export async function POST() {
  try {
    const prescription = {
      patientId: DEMO_PATIENT.id,
      patientName: DEMO_PATIENT.name,
      drugId: "amoxicillin",
      drugName: "Amoxicillin",
      dose: "1g BID",
      duration: "10 days",
      prescribedAt: new Date().toISOString(),
      centorScore: 4,
    };

    await kvPut(`prescription:${DEMO_PATIENT.id}`, prescription);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
