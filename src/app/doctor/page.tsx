"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NavHeader } from "@/components/nav-header";
import { CentorGauge } from "@/components/centor-gauge";
import { AntibioticCard } from "@/components/antibiotic-card";
import { DEMO_PATIENT } from "@/data/demo-patient";
import { cn } from "@/lib/utils";

interface DoctorData {
  patient: {
    id: string;
    name: string;
    age: number;
    sex: string;
    chiefComplaint: string;
    symptoms: string;
  };
  criteria: Record<string, unknown>;
  reasoning: {
    score: number;
    breakdown?: {
      tonsillarExudate: number;
      tenderNodes: number;
      fever: number;
      absenceOfCough: number;
      ageModifier: number;
    };
    managementBand: "symptomatic_only" | "consider_radt" | "radt_or_empiric";
    managementAdvice: string;
    gasProbability: string;
    clinicalSummary: string;
    guidelineMatchedOptions: Array<{
      drugId: string;
      drugName: string;
      dose: string;
      duration: string;
      rationale: string;
    }>;
  };
}

// 演示 fallback 数据（当没有从 /patient 过来时）
const DEMO_FALLBACK: DoctorData = {
  patient: {
    id: DEMO_PATIENT.id,
    name: DEMO_PATIENT.name,
    age: DEMO_PATIENT.age,
    sex: DEMO_PATIENT.sex,
    chiefComplaint: DEMO_PATIENT.chiefComplaint,
    symptoms: DEMO_PATIENT.symptoms,
  },
  criteria: {},
  reasoning: {
    score: 4,
    breakdown: {
      tonsillarExudate: 1,
      tenderNodes: 1,
      fever: 1,
      absenceOfCough: 1,
      ageModifier: 0,
    },
    managementBand: "radt_or_empiric",
    managementAdvice:
      "High likelihood of GAS (~51–53%). Current IDSA guidance still recommends confirmatory RADT before antibiotic. If RADT unavailable or positive, guideline-matched antibiotic options below.",
    gasProbability: "~51–53% likelihood of GAS",
    clinicalSummary:
      "A 35-year-old female presents with a 3-day history of acute pharyngitis characterized by fever (38.5°C), tonsillar exudate, and tender anterior cervical lymphadenopathy without cough, yielding a McIsaac score of 4/5. Guideline-matched options for GP consideration are listed below; confirmatory testing recommended where available.",
    guidelineMatchedOptions: [
      {
        drugId: "amoxicillin",
        drugName: "Amoxicillin",
        dose: "1g BID",
        duration: "10 days",
        rationale:
          "Broad-spectrum penicillin. Standard first-line treatment for Group A Streptococcal pharyngitis per ESCMID/IDSA guidelines.",
      },
      {
        drugId: "penicillin-v",
        drugName: "Penicillin V",
        dose: "500mg TID",
        duration: "10 days",
        rationale:
          "Narrow-spectrum penicillin. Equally effective as amoxicillin; preferred when narrow spectrum is desired.",
      },
      {
        drugId: "azithromycin",
        drugName: "Azithromycin",
        dose: "500mg day 1, then 250mg days 2–5",
        duration: "5 days",
        rationale:
          "Macrolide antibiotic. Reserved for patients with confirmed penicillin allergy. Shorter course may improve adherence.",
      },
    ],
  },
};

function ManagementPanel({
  band,
  advice,
  gasProbability,
}: {
  band: DoctorData["reasoning"]["managementBand"];
  advice: string;
  gasProbability: string;
}) {
  const config = {
    symptomatic_only: {
      color: "bg-score-green",
      lightBg: "bg-score-green/5 border-score-green/20",
      icon: (
        <svg className="w-5 h-5 text-score-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Symptomatic Treatment Only",
    },
    consider_radt: {
      color: "bg-score-yellow",
      lightBg: "bg-score-yellow/5 border-score-yellow/20",
      icon: (
        <svg className="w-5 h-5 text-score-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      label: "Consider RADT Before Antibiotic",
    },
    radt_or_empiric: {
      color: "bg-score-red",
      lightBg: "bg-score-red/5 border-score-red/20",
      icon: (
        <svg className="w-5 h-5 text-score-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      ),
      label: "RADT Recommended — Consider Antibiotic",
    },
  };

  const c = config[band];

  return (
    <div className={cn("rounded-lg border p-5 space-y-3", c.lightBg)}>
      <div className="flex items-center gap-2">
        {c.icon}
        <span className="font-semibold text-sm">{c.label}</span>
      </div>
      <p className="text-sm leading-relaxed">{advice}</p>
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", c.color)} />
        <span className="text-xs text-muted-foreground font-medium">
          {gasProbability}
        </span>
      </div>
    </div>
  );
}

export default function DoctorPage() {
  const [data, setData] = useState<DoctorData | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [prescribing, setPrescribing] = useState(false);
  const [prescribed, setPrescribed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("persana_doctor_data");
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      setData(DEMO_FALLBACK);
      setUsedFallback(true);
    }
  }, []);

  async function handlePrescribe() {
    if (!selectedDrug || !data) return;
    setPrescribing(true);

    try {
      const drug = data.reasoning.guidelineMatchedOptions.find(
        (o) => o.drugId === selectedDrug
      );
      if (!drug) return;

      const res = await fetch("/api/prescribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: data.patient.id,
          patientName: data.patient.name,
          drugId: drug.drugId,
          drugName: drug.drugName,
          dose: drug.dose,
          duration: drug.duration,
          centorScore: data.reasoning.score,
        }),
      });

      if (!res.ok) throw new Error("Failed to prescribe");
      setPrescribed(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setPrescribing(false);
    }
  }

  const showAntibioticOptions =
    data && data.reasoning.managementBand !== "symptomatic_only";

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader currentPage="doctor" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader currentPage="doctor" />

      {/* 免责声明横幅 */}
      <div className="bg-primary/5 border-b border-primary/10 py-2 px-4 text-center text-xs text-primary font-medium">
        AI-surfaced options — clinical decision remains with the physician
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 mt-2">
        {/* 演示数据提示 */}
        {usedFallback && (
          <Alert>
            <AlertDescription className="text-xs">
              Using demo data for Marta Rossi (Centor 4). For live analysis,
              start from the{" "}
              <a href="/patient" className="underline font-medium">
                patient intake page
              </a>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* 患者卡片 + 评分 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 患者信息 — 占 1 列 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">
                Patient
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">MR</span>
                </div>
                <div>
                  <p className="font-bold text-lg">{data.patient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {data.patient.age}{data.patient.sex}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Chief Complaint
                </p>
                <p className="text-sm">{data.patient.chiefComplaint}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Symptoms
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data.patient.symptoms}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* McIsaac 评分仪表 — 占 1 列 */}
          <Card className="shadow-sm">
            <CardContent className="pt-6 pb-4">
              <CentorGauge
                score={data.reasoning.score}
                breakdown={data.reasoning.breakdown}
              />
            </CardContent>
          </Card>

          {/* 管理建议 — 占 1 列 */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">
                Management Guidance
              </CardDescription>
              <CardTitle className="text-sm">
                Deterministic Score-Based Mapping
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ManagementPanel
                band={data.reasoning.managementBand}
                advice={data.reasoning.managementAdvice}
                gasProbability={data.reasoning.gasProbability}
              />
            </CardContent>
          </Card>
        </div>

        {/* LLM 临床摘要 */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Clinical Summary</CardTitle>
              <Badge variant="outline" className="text-[10px]">
                AI-generated
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">
              {data.reasoning.clinicalSummary}
            </p>
            <p className="text-[11px] text-muted-foreground mt-3 italic">
              Confirmatory testing recommended where available. This summary is
              AI-generated and does not constitute a management decision.
            </p>
          </CardContent>
        </Card>

        {/* 抗生素选项 */}
        {showAntibioticOptions && (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold">
                Guideline-Matched Antibiotic Options
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {data.reasoning.managementBand === "consider_radt"
                ? "Conditional on positive RADT result. Do not prescribe empirically."
                : "RADT confirmation recommended. If unavailable or positive, consider options below."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.reasoning.guidelineMatchedOptions.map((option) => (
                <AntibioticCard
                  key={option.drugId}
                  drugId={option.drugId}
                  rationale={option.rationale}
                  onSelect={setSelectedDrug}
                  selected={selectedDrug === option.drugId}
                  disabled={prescribed}
                />
              ))}
            </div>
          </div>
        )}

        {!showAntibioticOptions && (
          <Card className="border-score-green/20 bg-score-green/5">
            <CardContent className="py-5 text-center">
              <p className="text-sm font-medium text-score-green">
                McIsaac score ≤ 1 — Antibiotics not indicated
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Symptomatic treatment (NSAIDs, fluids, rest) is the
                guideline-matched approach.
              </p>
            </CardContent>
          </Card>
        )}

        {/* 处方操作区 */}
        {selectedDrug && !prescribed && (
          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              className="px-12 h-12"
              onClick={handlePrescribe}
              disabled={prescribing}
            >
              {prescribing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Saving...
                </span>
              ) : (
                "Confirm Prescription"
              )}
            </Button>
          </div>
        )}

        {prescribed && (
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">Prescription Saved</p>
                  <p className="text-xs text-muted-foreground">
                    Proceed to follow-up to monitor adherence.
                  </p>
                </div>
              </div>
              <Button onClick={() => (window.location.href = "/followup")}>
                Follow-up →
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
