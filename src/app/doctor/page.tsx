"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CentorGauge } from "@/components/centor-gauge";
import { AntibioticCard } from "@/components/antibiotic-card";

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

function ManagementBadge({ band }: { band: DoctorData["reasoning"]["managementBand"] }) {
  switch (band) {
    case "symptomatic_only":
      return (
        <Badge className="bg-score-green text-white text-sm px-3 py-1">
          Symptomatic Treatment Only
        </Badge>
      );
    case "consider_radt":
      return (
        <Badge className="bg-score-yellow text-white text-sm px-3 py-1">
          Consider RADT Before Antibiotic
        </Badge>
      );
    case "radt_or_empiric":
      return (
        <Badge className="bg-score-red text-white text-sm px-3 py-1">
          RADT Recommended — Antibiotic Options Below
        </Badge>
      );
  }
}

export default function DoctorPage() {
  const [data, setData] = useState<DoctorData | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [prescribing, setPrescribing] = useState(false);
  const [prescribed, setPrescribed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("persana_doctor_data");
    if (stored) {
      setData(JSON.parse(stored));
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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-primary">Persana Health — GP Dashboard</CardTitle>
            <CardDescription>No patient data available.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please submit patient intake data from the patient page first.
            </p>
            <Button variant="outline" onClick={() => (window.location.href = "/patient")}>
              Go to Patient Intake
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部免责声明横幅 */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-center text-sm">
        AI-surfaced options — clinical decision remains with the physician
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Persana Health</h1>
            <p className="text-sm text-muted-foreground">GP Clinical Decision Support</p>
          </div>
          {prescribed && (
            <Button onClick={() => (window.location.href = "/followup")}>
              Go to Follow-up →
            </Button>
          )}
        </div>

        {/* 患者摘要卡片 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <CardTitle>{data.patient.name}</CardTitle>
              <Badge variant="secondary">
                {data.patient.age}{data.patient.sex}
              </Badge>
            </div>
            <CardDescription>{data.patient.chiefComplaint}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{data.patient.symptoms}</p>
          </CardContent>
        </Card>

        {/* 评分 + 管理建议区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 左侧：McIsaac 评分仪表 */}
          <Card>
            <CardContent className="pt-6">
              <CentorGauge score={data.reasoning.score} />
              <div className="text-center mt-3 text-sm text-muted-foreground">
                {data.reasoning.gasProbability}
              </div>
            </CardContent>
          </Card>

          {/* 右侧：确定性管理建议（Step B 输出） */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Management Guidance</CardTitle>
              <CardDescription>Deterministic mapping based on McIsaac score</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ManagementBadge band={data.reasoning.managementBand} />
              <p className="text-sm leading-relaxed font-medium">
                {data.reasoning.managementAdvice}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* LLM 临床摘要（Step C 输出） */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Clinical Summary</CardTitle>
              <Badge variant="outline" className="text-xs">AI-generated</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed">{data.reasoning.clinicalSummary}</p>
            <Separator />
            <p className="text-xs text-muted-foreground italic">
              Confirmatory testing recommended where available. This summary is AI-generated
              and does not constitute a management decision.
            </p>
          </CardContent>
        </Card>

        {/* 抗生素选项——仅在 score ≥ 2 时显示 */}
        {showAntibioticOptions && (
          <div>
            <h2 className="text-lg font-semibold mb-1">
              Guideline-Matched Antibiotic Options for GP Consideration
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              {data.reasoning.managementBand === "consider_radt"
                ? "Display conditional on positive RADT result."
                : "RADT confirmation recommended. If unavailable or positive, options below."}
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

        {/* Score ≤ 1 时显示对症治疗提示 */}
        {!showAntibioticOptions && (
          <Alert>
            <AlertDescription>
              McIsaac score ≤ 1 — antibiotic options are not indicated for this
              presentation. Symptomatic treatment (NSAIDs, fluids, rest) is the
              guideline-matched approach.
            </AlertDescription>
          </Alert>
        )}

        {/* 处方确认 */}
        {selectedDrug && !prescribed && (
          <div className="flex justify-center">
            <Button size="lg" onClick={handlePrescribe} disabled={prescribing}>
              {prescribing ? "Prescribing..." : "Confirm Prescription"}
            </Button>
          </div>
        )}

        {prescribed && (
          <Alert>
            <AlertDescription className="text-center">
              Prescription confirmed and saved. You can now proceed to the follow-up view
              to monitor patient adherence.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
