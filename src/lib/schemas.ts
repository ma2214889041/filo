import { z } from "zod/v4";

// --- Intake Agent 输出 schema ---
export const CentorCriteriaSchema = z.object({
  tonsillar_exudate: z.union([z.boolean(), z.literal("unknown")]),
  tender_anterior_cervical_nodes: z.union([z.boolean(), z.literal("unknown")]),
  fever_over_38: z.union([z.boolean(), z.literal("unknown")]),
  absence_of_cough: z.union([z.boolean(), z.literal("unknown")]),
  age_band: z.enum(["3-14", "15-44", "45+"]),
});

export type CentorCriteria = z.infer<typeof CentorCriteriaSchema>;

// --- Intake API 请求 schema ---
export const IntakeRequestSchema = z.object({
  symptoms: z.string().min(1),
  temperature: z.number(),
  daysSick: z.number(),
  age: z.number(),
  patientName: z.string().optional(),
});

export type IntakeRequest = z.infer<typeof IntakeRequestSchema>;

// --- Clinical Reasoning 输出 schema ---
export const ClinicalReasoningOutputSchema = z.object({
  clinicalSummary: z.string(),
  probability: z.enum(["likely viral", "uncertain", "likely bacterial"]),
  guidelineMatchedOptions: z.array(
    z.object({
      drugId: z.string(),
      drugName: z.string(),
      dose: z.string(),
      duration: z.string(),
      rationale: z.string(),
    })
  ),
});

export type ClinicalReasoningOutput = z.infer<typeof ClinicalReasoningOutputSchema>;

// --- 处方 schema ---
export const PrescriptionSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  drugId: z.string(),
  drugName: z.string(),
  dose: z.string(),
  duration: z.string(),
  prescribedAt: z.string(),
  centorScore: z.number(),
});

export type Prescription = z.infer<typeof PrescriptionSchema>;

// --- Adherence 请求 schema ---
export const AdherenceRequestSchema = z.object({
  patientId: z.string(),
  message: z.string().min(1),
});

export type AdherenceRequest = z.infer<typeof AdherenceRequestSchema>;

// --- GP 告警 ---
export interface GpAlert {
  patientId: string;
  reason: string;
  urgency: "low" | "medium" | "high";
  timestamp: string;
}
