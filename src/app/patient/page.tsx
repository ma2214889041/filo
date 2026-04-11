"use client";

import { useState, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NavHeader } from "@/components/nav-header";
import { DEMO_PATIENT } from "@/data/demo-patient";
import { useI18n } from "@/lib/i18n";

/* ================================================================
   Types & Constants
   ================================================================ */

type AgeBand = "3-14" | "15-44" | "45+";

interface CriterionOption {
  label: string;
  points: number;
  value: string;
}

const SCORE_PROBABILITY: Record<number, { range: string; pct: number }> = {
  0: { range: "1–2.5%", pct: 2 },
  1: { range: "5–10%", pct: 8 },
  2: { range: "11–17%", pct: 14 },
  3: { range: "28–35%", pct: 32 },
  4: { range: "51–53%", pct: 52 },
  5: { range: "51–53%", pct: 52 },
};

/* ================================================================
   Main Page Component
   ================================================================ */

export default function PatientPage() {
  const { t } = useI18n();

  // --- Centor criteria ---
  const [ageBand, setAgeBand] = useState<AgeBand | null>(null);
  const [tonsillarExudate, setTonsillarExudate] = useState<boolean | null>(null);
  const [tenderNodes, setTenderNodes] = useState<boolean | null>(null);
  const [feverOver38, setFeverOver38] = useState<boolean | null>(null);
  const [coughAbsent, setCoughAbsent] = useState<boolean | null>(null);

  // --- Additional context ---
  const [temperature, setTemperature] = useState("");
  const [daysSick, setDaysSick] = useState("");

  // --- Image upload ---
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- AI explanation ---
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);

  // --- Info tabs ---
  const [activeTab, setActiveTab] = useState<string>("when");

  // --- Submit flow ---
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const allSelected =
    ageBand !== null &&
    tonsillarExudate !== null &&
    tenderNodes !== null &&
    feverOver38 !== null &&
    coughAbsent !== null;

  // --- Running McIsaac score ---
  const score = useMemo(() => {
    if (!allSelected) return null;
    let s = 0;
    if (tonsillarExudate) s += 1;
    if (tenderNodes) s += 1;
    if (feverOver38) s += 1;
    if (coughAbsent) s += 1;
    if (ageBand === "3-14") s += 1;
    else if (ageBand === "45+") s -= 1;
    return Math.max(0, Math.min(5, s));
  }, [tonsillarExudate, tenderNodes, feverOver38, coughAbsent, ageBand, allSelected]);

  const prob = score !== null ? SCORE_PROBABILITY[score] : null;

  const scoreColor =
    score === null
      ? "text-muted-foreground"
      : score <= 1
        ? "text-score-green"
        : score <= 3
          ? "text-score-yellow"
          : "text-score-red";

  const scoreBg =
    score === null
      ? "bg-muted/50"
      : score <= 1
        ? "bg-score-green/10"
        : score <= 3
          ? "bg-score-yellow/10"
          : "bg-score-red/10";

  const scoreBorder =
    score === null
      ? "border-border"
      : score <= 1
        ? "border-score-green/30"
        : score <= 3
          ? "border-score-yellow/30"
          : "border-score-red/30";

  // --- Score table (translated) ---
  const SCORE_TABLE = [
    { score: "0", prob: "1–2.5%", action: t("patient.tableR0") },
    { score: "1", prob: "5–10%", action: t("patient.tableR1") },
    { score: "2", prob: "11–17%", action: t("patient.tableR2") },
    { score: "3", prob: "28–35%", action: t("patient.tableR3") },
    { score: "\u22654", prob: "51–53%", action: t("patient.tableR4") },
  ];

  // --- Info tabs (translated) ---
  const INFO_TABS = [
    { id: "when", label: t("patient.tabWhen") },
    { id: "pearls", label: t("patient.tabPearls") },
    { id: "why", label: t("patient.tabWhy") },
    { id: "next", label: t("patient.tabNext") },
    { id: "evidence", label: t("patient.tabEvidence") },
    { id: "creator", label: t("patient.tabCreator") },
  ];

  /* ---- helpers ---- */

  function buildSymptomsText(): string {
    const parts: string[] = [];
    if (tonsillarExudate) parts.push("placche/essudato tonsillare");
    if (tenderNodes) parts.push("linfonodi cervicali anteriori dolenti e gonfi");
    if (feverOver38)
      parts.push(`febbre${temperature ? ` (${temperature}\u00b0C)` : " >38\u00b0C"}`);
    if (coughAbsent) parts.push("assenza di tosse");
    else if (coughAbsent === false) parts.push("tosse presente");
    if (daysSick) parts.push(`da ${daysSick} giorni`);
    return parts.length > 0
      ? `Mal di gola con ${parts.join(", ")}.`
      : "Nessun sintomo selezionato.";
  }

  function prefillDemo() {
    setAgeBand("15-44");
    setTonsillarExudate(true);
    setTenderNodes(true);
    setFeverOver38(true);
    setCoughAbsent(true);
    setTemperature("38.5");
    setDaysSick("3");
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageData(null);
    setImageFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  /* ---- AI explanation ---- */

  async function requestExplanation() {
    if (score === null) return;
    setExplainLoading(true);
    setExplanation(null);
    try {
      const managementBand =
        score <= 1
          ? "symptomatic_only"
          : score <= 3
            ? "consider_radt"
            : "radt_or_empiric";

      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: {
            tonsillar_exudate: tonsillarExudate,
            tender_anterior_cervical_nodes: tenderNodes,
            fever_over_38: feverOver38,
            absence_of_cough: coughAbsent,
            age_band: ageBand,
          },
          score,
          probability: prob?.range,
          managementBand,
          image: imageData,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Explanation failed");
      }
      const data = await res.json();
      setExplanation(data.explanation);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setExplainLoading(false);
    }
  }

  /* ---- submit to doctor ---- */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allSelected) return;
    setLoading(true);

    try {
      const criteria = {
        tonsillar_exudate: tonsillarExudate,
        tender_anterior_cervical_nodes: tenderNodes,
        fever_over_38: feverOver38,
        absence_of_cough: coughAbsent,
        age_band: ageBand,
      };

      const ageEstimate =
        ageBand === "3-14" ? 10 : ageBand === "15-44" ? 30 : 55;

      setLoadingStep(t("patient.computingScore"));
      const reasonRes = await fetch("/api/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria,
          patientContext: {
            name: DEMO_PATIENT.name,
            age: ageEstimate,
            sex: DEMO_PATIENT.sex,
            symptoms: buildSymptomsText(),
            temperature: parseFloat(temperature) || 38.0,
            daysSick: parseInt(daysSick) || 1,
          },
        }),
      });

      if (!reasonRes.ok) {
        const err = await reasonRes.json();
        throw new Error(err.error || "Reasoning failed");
      }

      const reasonData = await reasonRes.json();

      sessionStorage.setItem(
        "persana_doctor_data",
        JSON.stringify({
          patient: {
            id: DEMO_PATIENT.id,
            name: DEMO_PATIENT.name,
            age: ageEstimate,
            sex: DEMO_PATIENT.sex,
            chiefComplaint: DEMO_PATIENT.chiefComplaint,
            symptoms: buildSymptomsText(),
          },
          criteria,
          reasoning: reasonData,
        })
      );

      setSubmitted(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  }

  /* ================================================================
     RENDER — Success screen
     ================================================================ */

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader currentPage="patient" />
        <div className="flex items-center justify-center p-4 mt-16">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardContent className="pt-10 pb-8 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-score-green/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-score-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">{t("patient.sentSuccess")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("patient.sentSuccessDesc")}
                </p>
              </div>
              <Button size="lg" className="w-full" onClick={() => (window.location.href = "/doctor")}>
                {t("patient.goToDoctor")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ================================================================
     RENDER — Main form
     ================================================================ */

  return (
    <div className="min-h-screen bg-background">
      <NavHeader currentPage="patient" />

      <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-4 sm:mt-8 space-y-6">
        {/* ---- Hero ---- */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {t("patient.title")}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("patient.subtitle")}
          </p>
        </div>

        {/* ============================================================
            CALCULATOR CARD
            ============================================================ */}
        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t("patient.criteriaTitle")}</CardTitle>
                  <CardDescription>
                    {t("patient.criteriaDesc")}
                  </CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={prefillDemo}>
                  {t("common.demo")}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-2">
              {/* Patient info bar */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold text-sm">MR</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{DEMO_PATIENT.name}</p>
                  <p className="text-xs text-muted-foreground">Patient ID: {DEMO_PATIENT.id}</p>
                </div>
              </div>

              {/* ---- 5 Criteria ---- */}
              <div className="space-y-0 divide-y divide-border">
                <CriterionRow
                  label={t("patient.age")}
                  hint={t("patient.ageHint")}
                  options={[
                    { label: t("patient.age314"), points: 1, value: "3-14" },
                    { label: t("patient.age1544"), points: 0, value: "15-44" },
                    { label: t("patient.age45"), points: -1, value: "45+" },
                  ]}
                  selected={ageBand}
                  onSelect={(v) => setAgeBand(v as AgeBand)}
                />
                <CriterionRow
                  label={t("patient.exudate")}
                  options={[
                    { label: t("patient.no"), points: 0, value: "false" },
                    { label: t("patient.yes"), points: 1, value: "true" },
                  ]}
                  selected={tonsillarExudate === null ? null : tonsillarExudate ? "true" : "false"}
                  onSelect={(v) => setTonsillarExudate(v === "true")}
                />
                <CriterionRow
                  label={t("patient.nodes")}
                  options={[
                    { label: t("patient.no"), points: 0, value: "false" },
                    { label: t("patient.yes"), points: 1, value: "true" },
                  ]}
                  selected={tenderNodes === null ? null : tenderNodes ? "true" : "false"}
                  onSelect={(v) => setTenderNodes(v === "true")}
                />
                <CriterionRow
                  label={t("patient.fever")}
                  options={[
                    { label: t("patient.no"), points: 0, value: "false" },
                    { label: t("patient.yes"), points: 1, value: "true" },
                  ]}
                  selected={feverOver38 === null ? null : feverOver38 ? "true" : "false"}
                  onSelect={(v) => setFeverOver38(v === "true")}
                />
                <CriterionRow
                  label={t("patient.cough")}
                  options={[
                    { label: t("patient.coughPresent"), points: 0, value: "present" },
                    { label: t("patient.coughAbsent"), points: 1, value: "absent" },
                  ]}
                  selected={coughAbsent === null ? null : coughAbsent ? "absent" : "present"}
                  onSelect={(v) => setCoughAbsent(v === "absent")}
                />
              </div>

              {/* ---- Additional info + Image ---- */}
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-sm font-medium text-muted-foreground mb-3">
                  {t("patient.additionalInfo")}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("patient.tempExact")}</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="35"
                      max="42"
                      placeholder="es. 38.5"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">{t("patient.daysSick")}</label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      placeholder="es. 3"
                      value={daysSick}
                      onChange={(e) => setDaysSick(e.target.value)}
                    />
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t("patient.imageLabel")}
                  </label>
                  {imageData ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                      <img
                        src={imageData}
                        alt="Upload preview"
                        className="w-16 h-16 rounded-md object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{imageFileName}</p>
                        <p className="text-xs text-muted-foreground">{t("patient.imageUploaded")}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={removeImage}>
                        {t("common.remove")}
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                      </svg>
                      <span className="text-sm text-muted-foreground">
                        {t("patient.imageClick")}
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* ============================================================
                  SCORE RESULT PANEL
                  ============================================================ */}
              <div className={`mt-5 p-5 rounded-xl border ${scoreBorder} ${scoreBg} transition-all`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground mb-1">{t("patient.scoreLabel")}</p>
                    {score !== null ? (
                      <>
                        {/* Probability */}
                        <div className="mb-3">
                          <p className="text-2xl font-bold text-foreground">
                            {prob!.range}
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              {t("patient.strepProbability")}
                            </span>
                          </p>
                        </div>
                        {/* Probability bar */}
                        <div className="mb-3">
                          <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${prob!.pct}%`,
                                background:
                                  score <= 1
                                    ? "var(--color-score-green)"
                                    : score <= 3
                                      ? "var(--color-score-yellow)"
                                      : "var(--color-score-red)",
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>0%</span>
                            <span>Virale</span>
                            <span>Incerto</span>
                            <span>Batterico</span>
                            <span>100%</span>
                          </div>
                        </div>
                        {/* Management advice */}
                        <p className="text-sm text-muted-foreground">
                          {score <= 1
                            ? t("patient.riskLow")
                            : score <= 3
                              ? t("patient.riskModerate")
                              : t("patient.riskHigh")}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {t("patient.selectAllCriteria")}
                      </p>
                    )}
                  </div>
                  {/* Big score number */}
                  <div className="text-center shrink-0">
                    <span className={`text-5xl font-bold ${scoreColor} transition-colors`}>
                      {score !== null ? score : "\u2013"}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">/5</p>
                  </div>
                </div>

                {/* AI explanation button */}
                {score !== null && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={explainLoading}
                      onClick={requestExplanation}
                    >
                      {explainLoading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                          </svg>
                          {t("patient.aiAnalyzing")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                          </svg>
                          {imageData ? t("patient.askAIWithImage") : t("patient.askAI")}
                        </span>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* ---- AI Explanation ---- */}
              {explanation && (
                <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <p className="text-sm font-semibold text-primary">{t("patient.aiExplanation")}</p>
                  </div>
                  <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {explanation}
                  </div>
                </div>
              )}

              {/* ---- Submit ---- */}
              <Button
                type="submit"
                className="w-full h-12 text-base mt-5"
                disabled={loading || !allSelected}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    {loadingStep}
                  </span>
                ) : (
                  t("patient.sendToDoctor")
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* ============================================================
            SCORE–PROBABILITY TABLE
            ============================================================ */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("patient.tableTitle")}</CardTitle>
            <CardDescription>
              {t("patient.tableDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t("patient.tableScore")}</th>
                    <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">{t("patient.tableProbGAS")}</th>
                    <th className="text-left py-2 font-semibold text-muted-foreground">{t("patient.tableRecommendation")}</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORE_TABLE.map((row) => {
                    const isActive =
                      score !== null &&
                      ((row.score === "\u22654" && score >= 4) ||
                        row.score === String(score));
                    return (
                      <tr
                        key={row.score}
                        className={`border-b border-border/50 transition-colors ${
                          isActive ? scoreBg + " font-medium" : ""
                        }`}
                      >
                        <td className="py-2.5 pr-4">
                          <span className={isActive ? scoreColor + " font-bold" : ""}>
                            {row.score}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-xs">{row.prob}</td>
                        <td className="py-2.5 text-muted-foreground">{row.action}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
            EDUCATIONAL INFO TABS
            ============================================================ */}
        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            {/* Tab bar */}
            <div className="flex gap-1 overflow-x-auto pb-3 mb-4 border-b border-border scrollbar-none">
              {INFO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="text-sm text-foreground leading-relaxed space-y-3">
              {activeTab === "when" && <WhenToUse />}
              {activeTab === "pearls" && <PearlsPitfalls />}
              {activeTab === "why" && <WhyUse />}
              {activeTab === "next" && <NextSteps />}
              {activeTab === "evidence" && <Evidence />}
              {activeTab === "creator" && <CreatorInsights />}
            </div>
          </CardContent>
        </Card>

        {/* bottom spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}

/* ================================================================
   Criterion Row
   ================================================================ */

function CriterionRow({
  label,
  hint,
  options,
  selected,
  onSelect,
}: {
  label: string;
  hint?: string;
  options: CriterionOption[];
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="mb-2.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          const pointsLabel =
            opt.points > 0 ? `+${opt.points}` : opt.points === 0 ? "0" : `${opt.points}`;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium
                transition-all cursor-pointer
                ${
                  isSelected
                    ? opt.points > 0
                      ? "border-score-red bg-score-red/10 text-score-red ring-1 ring-score-red/30"
                      : opt.points < 0
                        ? "border-score-green bg-score-green/10 text-score-green ring-1 ring-score-green/30"
                        : "border-primary bg-primary/10 text-primary ring-1 ring-primary/30"
                    : "border-border bg-background text-foreground hover:bg-muted/50"
                }
              `}
            >
              <span>{opt.label}</span>
              <span className={`text-xs font-mono ${isSelected ? "opacity-100" : "opacity-50"}`}>
                {pointsLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   Educational Tab Content
   ================================================================ */

function WhenToUse() {
  const { t } = useI18n();
  return (
    <>
      <h3 className="font-semibold text-base">{t("patient.whenTitle")}</h3>
      <p>{t("patient.whenP1")}</p>
      <p>{t("patient.whenP2")}</p>
      <div className="p-3 rounded-lg bg-score-yellow/10 border border-score-yellow/20 text-score-yellow">
        <p className="font-medium">{t("patient.whenWarning")}</p>
        <p className="text-sm mt-1">{t("patient.whenWarningText")}</p>
      </div>
    </>
  );
}

function PearlsPitfalls() {
  const { t } = useI18n();
  return (
    <>
      <h3 className="font-semibold text-base">{t("patient.pearlsTitle")}</h3>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
        <li>{t("patient.pearl1")}</li>
        <li>{t("patient.pearl2")}</li>
        <li>{t("patient.pearl3")}</li>
        <li>{t("patient.pearl4")}</li>
        <li>{t("patient.pearl5")}</li>
      </ul>
    </>
  );
}

function WhyUse() {
  const { t } = useI18n();
  return (
    <>
      <h3 className="font-semibold text-base">{t("patient.whyTitle")}</h3>
      <p>{t("patient.whyP1")}</p>
      <p>{t("patient.whyP2")}</p>
      <p>{t("patient.whyP3")}</p>
    </>
  );
}

function NextSteps() {
  const { t } = useI18n();
  return (
    <>
      <h3 className="font-semibold text-base">{t("patient.nextTitle")}</h3>
      <p className="text-muted-foreground">{t("patient.nextDesc")}</p>
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 pr-3 font-semibold">{t("patient.tableScore")}</th>
              <th className="text-left py-2 pr-3 font-semibold">{t("patient.tableProbGAS")}</th>
              <th className="text-left py-2 font-semibold">{t("patient.nextManagement")}</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b border-border/50">
              <td className="py-2 pr-3">0</td>
              <td className="py-2 pr-3 font-mono text-xs">1–2.5%</td>
              <td className="py-2">{t("patient.nextR0")}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-3">1</td>
              <td className="py-2 pr-3 font-mono text-xs">5–10%</td>
              <td className="py-2">{t("patient.nextR1")}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-3">2</td>
              <td className="py-2 pr-3 font-mono text-xs">11–17%</td>
              <td className="py-2">{t("patient.nextR2")}</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-3">3</td>
              <td className="py-2 pr-3 font-mono text-xs">28–35%</td>
              <td className="py-2">{t("patient.nextR3")}</td>
            </tr>
            <tr>
              <td className="py-2 pr-3">{"\u2265"}4</td>
              <td className="py-2 pr-3 font-mono text-xs">51–53%</td>
              <td className="py-2">{t("patient.nextR4")}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-muted-foreground">{t("patient.nextNote")}</p>
    </>
  );
}

function Evidence() {
  const { t } = useI18n();
  return (
    <>
      <h3 className="font-semibold text-base">{t("patient.evidenceTitle")}</h3>
      <div className="space-y-4 text-muted-foreground">
        <div>
          <p className="font-medium text-foreground">{t("patient.ev1Title")}</p>
          <p>{t("patient.ev1Text")}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">{t("patient.ev2Title")}</p>
          <p>{t("patient.ev2Text")}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">{t("patient.ev3Title")}</p>
          <p>{t("patient.ev3Text")}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">{t("patient.ev4Title")}</p>
          <p>{t("patient.ev4Text")}</p>
        </div>
        <div>
          <p className="font-medium text-foreground">{t("patient.ev5Title")}</p>
          <p>{t("patient.ev5Text")}</p>
        </div>
      </div>
    </>
  );
}

function CreatorInsights() {
  const { t } = useI18n();
  return (
    <>
      <h3 className="font-semibold text-base">{t("patient.creatorTitle")}</h3>
      <p className="text-muted-foreground italic mb-3">{t("patient.creatorBy")}</p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground">
        <li>{t("patient.cr1")}</li>
        <li>{t("patient.cr2")}</li>
        <li>{t("patient.cr3")}</li>
        <li>{t("patient.cr4")}</li>
        <li>{t("patient.cr5")}</li>
      </ul>
    </>
  );
}
