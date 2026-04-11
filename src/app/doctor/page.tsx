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
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NavHeader } from "@/components/nav-header";
import { CentorGauge } from "@/components/centor-gauge";
import { DEMO_PATIENT } from "@/data/demo-patient";
import { ANTIBIOTICS } from "@/data/antibiotics";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

/* ================================================================
   Types
   ================================================================ */

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

interface EditableOption {
  drugId: string;
  drugName: string;
  dose: string;
  duration: string;
  line: string;
  contraindication: string | null;
  rationale: string;
  isCustom?: boolean;
}

// Demo fallback
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
      "High likelihood of GAS (~51\u201353%). Current IDSA guidance still recommends confirmatory RADT before antibiotic. If RADT unavailable or positive, guideline-matched antibiotic options below.",
    gasProbability: "~51\u201353% likelihood of GAS",
    clinicalSummary:
      "A 35-year-old female presents with a 3-day history of acute pharyngitis characterized by fever (38.5\u00b0C), tonsillar exudate, and tender anterior cervical lymphadenopathy without cough, yielding a McIsaac score of 4/5. Guideline-matched options for GP consideration are listed below; confirmatory testing recommended where available.",
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
        dose: "500mg day 1, then 250mg days 2\u20135",
        duration: "5 days",
        rationale:
          "Macrolide antibiotic. Reserved for patients with confirmed penicillin allergy. Shorter course may improve adherence.",
      },
    ],
  },
};

/* ================================================================
   Management Panel
   ================================================================ */

function ManagementPanel({
  band,
  advice,
  gasProbability,
}: {
  band: DoctorData["reasoning"]["managementBand"];
  advice: string;
  gasProbability: string;
}) {
  const { t } = useI18n();

  const config = {
    symptomatic_only: {
      color: "bg-score-green",
      lightBg: "bg-score-green/5 border-score-green/20",
      icon: (
        <svg className="w-5 h-5 text-score-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: t("doctor.symptomaticOnly"),
    },
    consider_radt: {
      color: "bg-score-yellow",
      lightBg: "bg-score-yellow/5 border-score-yellow/20",
      icon: (
        <svg className="w-5 h-5 text-score-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      ),
      label: t("doctor.considerRadt"),
    },
    radt_or_empiric: {
      color: "bg-score-red",
      lightBg: "bg-score-red/5 border-score-red/20",
      icon: (
        <svg className="w-5 h-5 text-score-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      ),
      label: t("doctor.radtOrEmpiric"),
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
        <span className="text-xs text-muted-foreground font-medium">{gasProbability}</span>
      </div>
    </div>
  );
}

/* ================================================================
   Main Page
   ================================================================ */

export default function DoctorPage() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<DoctorData | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [prescribing, setPrescribing] = useState(false);
  const [prescribed, setPrescribed] = useState(false);

  // Editable antibiotic options
  const [editableOptions, setEditableOptions] = useState<EditableOption[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customDrug, setCustomDrug] = useState({ name: "", dose: "", duration: "", notes: "" });

  // Visit type
  const [visitType, setVisitType] = useState<"video" | "in_person" | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("persana_doctor_data");
    if (stored) {
      const parsed = JSON.parse(stored) as DoctorData;
      setData(parsed);
      initEditableOptions(parsed);
    } else {
      setData(DEMO_FALLBACK);
      initEditableOptions(DEMO_FALLBACK);
      setUsedFallback(true);
    }
  }, []);

  function initEditableOptions(d: DoctorData) {
    const options: EditableOption[] = d.reasoning.guidelineMatchedOptions.map((opt) => {
      const ab = ANTIBIOTICS.find((a) => a.id === opt.drugId);
      return {
        drugId: opt.drugId,
        drugName: opt.drugName,
        dose: opt.dose,
        duration: opt.duration,
        line: ab?.line || "Guideline-matched",
        contraindication: ab?.contraindication || null,
        rationale: opt.rationale,
      };
    });
    setEditableOptions(options);
  }

  function updateOption(drugId: string, field: "dose" | "duration", value: string) {
    setEditableOptions((prev) =>
      prev.map((opt) => (opt.drugId === drugId ? { ...opt, [field]: value } : opt))
    );
  }

  function addCustomDrug() {
    if (!customDrug.name || !customDrug.dose || !customDrug.duration) return;
    const newOption: EditableOption = {
      drugId: `custom-${Date.now()}`,
      drugName: customDrug.name,
      dose: customDrug.dose,
      duration: customDrug.duration,
      line: "Custom",
      contraindication: null,
      rationale: customDrug.notes || "Farmaco personalizzato aggiunto dal medico.",
      isCustom: true,
    };
    setEditableOptions((prev) => [...prev, newOption]);
    setCustomDrug({ name: "", dose: "", duration: "", notes: "" });
    setShowCustomForm(false);
  }

  function removeCustomDrug(drugId: string) {
    setEditableOptions((prev) => prev.filter((o) => o.drugId !== drugId));
    if (selectedDrug === drugId) setSelectedDrug(null);
  }

  async function handlePrescribe() {
    if (!selectedDrug || !data) return;
    setPrescribing(true);

    try {
      const drug = editableOptions.find((o) => o.drugId === selectedDrug);
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

      // Save prescription to sessionStorage for followup page
      const prescriptionData = {
        patientId: data.patient.id,
        patientName: data.patient.name,
        drugName: drug.drugName,
        dose: drug.dose,
        duration: drug.duration,
        prescribedAt: new Date().toISOString(),
        centorScore: data.reasoning.score,
      };
      sessionStorage.setItem("persana_prescription", JSON.stringify(prescriptionData));

      setPrescribed(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setPrescribing(false);
    }
  }

  const showAntibioticOptions = data && data.reasoning.managementBand !== "symptomatic_only";

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader currentPage="doctor" />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader currentPage="doctor" />

      <div className="bg-primary/5 border-b border-primary/10 py-2 px-4 text-center text-xs text-primary font-medium">
        {t("doctor.disclaimer")}
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 mt-2">
        {usedFallback && (
          <Alert>
            <AlertDescription className="text-xs">
              {t("doctor.demoAlert")}{" "}
              <a href="/patient" className="underline font-medium">{t("doctor.demoAlertLink")}</a>.
            </AlertDescription>
          </Alert>
        )}

        {/* Patient + Score + Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">{t("doctor.patientLabel")}</CardDescription>
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
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("doctor.chiefComplaint")}</p>
                <p className="text-sm">{data.patient.chiefComplaint}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">{t("doctor.symptoms")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{data.patient.symptoms}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="pt-6 pb-4">
              <CentorGauge score={data.reasoning.score} breakdown={data.reasoning.breakdown} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs uppercase tracking-wider">{t("doctor.managementGuidance")}</CardDescription>
              <CardTitle className="text-sm">{t("doctor.managementTitle")}</CardTitle>
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

        {/* Clinical Summary */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{t("doctor.clinicalSummary")}</CardTitle>
              <Badge variant="outline" className="text-[10px]">{t("doctor.aiGenerated")}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data.reasoning.clinicalSummary}</p>
            <p className="text-[11px] text-muted-foreground mt-3 italic">
              {t("doctor.summaryDisclaimer")}
            </p>
          </CardContent>
        </Card>

        {/* ============================================================
            VISIT TYPE SELECTION
            ============================================================ */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("doctor.visitTypeTitle")}</CardTitle>
            <CardDescription>{t("doctor.visitTypeDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Video Call */}
              <button
                type="button"
                onClick={() => setVisitType("video")}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer text-left",
                  visitType === "video"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  visitType === "video" ? "bg-primary/10" : "bg-muted"
                )}>
                  <svg className={cn("w-6 h-6", visitType === "video" ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <div>
                  <p className={cn("font-semibold", visitType === "video" ? "text-primary" : "text-foreground")}>
                    {t("doctor.videoCall")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("doctor.videoCallDesc")}
                  </p>
                </div>
                {visitType === "video" && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>

              {/* In-Person */}
              <button
                type="button"
                onClick={() => setVisitType("in_person")}
                className={cn(
                  "flex items-center gap-4 p-5 rounded-xl border-2 transition-all cursor-pointer text-left",
                  visitType === "in_person"
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  visitType === "in_person" ? "bg-primary/10" : "bg-muted"
                )}>
                  <svg className={cn("w-6 h-6", visitType === "in_person" ? "text-primary" : "text-muted-foreground")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <div>
                  <p className={cn("font-semibold", visitType === "in_person" ? "text-primary" : "text-foreground")}>
                    {t("doctor.inPerson")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("doctor.inPersonDesc")}
                  </p>
                </div>
                {visitType === "in_person" && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================
            BOOKING LINK (after visit type selected)
            ============================================================ */}
        {visitType && (
          <Card className="shadow-sm border-primary/20 bg-primary/5">
            <CardContent className="py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold">{t("doctor.bookingSent")}</p>
                  <p className="text-xs text-muted-foreground">
                    {visitType === "video" ? t("doctor.bookingSentDescVideo") : t("doctor.bookingSentDescInPerson")}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => window.open(`/booking?type=${visitType}`, "_blank")}>
                {t("doctor.viewBooking")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ============================================================
            EDITABLE ANTIBIOTIC OPTIONS (after visit type selected)
            ============================================================ */}
        {showAntibioticOptions && visitType && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold">{t("doctor.antibioticTitle")}</h2>
              {!prescribed && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomForm(true)}
                  className="text-xs"
                >
                  {t("doctor.addDrug")}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              {data.reasoning.managementBand === "consider_radt"
                ? t("doctor.antibioticSubRadt")
                : t("doctor.antibioticSubEmpiric")}
              {" "}
              <span className="font-medium">{t("doctor.editableNote")}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {editableOptions.map((option) => {
                const isSelected = selectedDrug === option.drugId;
                return (
                  <Card
                    key={option.drugId}
                    className={cn(
                      "transition-all duration-200 cursor-pointer group",
                      isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-md hover:border-primary/30",
                      prescribed && !isSelected && "opacity-50 cursor-default"
                    )}
                    onClick={() => !prescribed && setSelectedDrug(option.drugId)}
                  >
                    <CardContent className="p-5 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-base">{option.drugName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-[10px] font-medium">
                              {option.line}
                            </Badge>
                            {option.isCustom && !prescribed && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeCustomDrug(option.drugId); }}
                                className="text-[10px] text-destructive hover:underline cursor-pointer"
                              >
                                {t("common.remove")}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5",
                          isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                        )}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Editable dose & duration */}
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">{t("doctor.dose")}</span>
                          {prescribed ? (
                            <span className="font-semibold text-sm">{option.dose}</span>
                          ) : (
                            <Input
                              value={option.dose}
                              onChange={(e) => updateOption(option.drugId, "dose", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 text-sm font-semibold"
                            />
                          )}
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block mb-1">{t("doctor.duration")}</span>
                          {prescribed ? (
                            <span className="font-semibold text-sm">{option.duration}</span>
                          ) : (
                            <Input
                              value={option.duration}
                              onChange={(e) => updateOption(option.drugId, "duration", e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 text-sm font-semibold"
                            />
                          )}
                        </div>
                      </div>

                      {/* Contraindication */}
                      {option.contraindication && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive bg-alert-red-light rounded-md px-2.5 py-1.5">
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
                          </svg>
                          <span>{option.contraindication}</span>
                        </div>
                      )}

                      {/* Rationale */}
                      <p className="text-xs text-muted-foreground leading-relaxed">{option.rationale}</p>

                      {/* Select button */}
                      <Button
                        className="w-full"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); if (!prescribed) setSelectedDrug(option.drugId); }}
                        disabled={prescribed}
                      >
                        {isSelected ? t("common.selected") : t("common.select")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Custom drug form */}
            {showCustomForm && !prescribed && (
              <Card className="mt-4 border-dashed border-2 border-primary/30">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-sm">{t("doctor.addCustomTitle")}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">{t("doctor.drugName")} *</label>
                      <Input
                        placeholder="es. Cefuroxime"
                        value={customDrug.name}
                        onChange={(e) => setCustomDrug((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t("doctor.dosage")} *</label>
                      <Input
                        placeholder="es. 250mg BID"
                        value={customDrug.dose}
                        onChange={(e) => setCustomDrug((p) => ({ ...p, dose: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">{t("doctor.duration")} *</label>
                      <Input
                        placeholder="es. 7 days"
                        value={customDrug.duration}
                        onChange={(e) => setCustomDrug((p) => ({ ...p, duration: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">{t("doctor.notes")}</label>
                    <Input
                      placeholder="Motivazione della scelta..."
                      value={customDrug.notes}
                      onChange={(e) => setCustomDrug((p) => ({ ...p, notes: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button size="sm" onClick={addCustomDrug} disabled={!customDrug.name || !customDrug.dose || !customDrug.duration}>
                      {t("common.add")}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowCustomForm(false)}>
                      {t("common.cancel")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!showAntibioticOptions && visitType && (
          <Card className="border-score-green/20 bg-score-green/5">
            <CardContent className="py-5 text-center">
              <p className="text-sm font-medium text-score-green">
                {t("doctor.noAntibiotics")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("doctor.noAntibioticsDesc")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Prescribe action */}
        {selectedDrug && !prescribed && (
          <div className="flex justify-center pt-2">
            <Button size="lg" className="px-12 h-12" onClick={handlePrescribe} disabled={prescribing}>
              {prescribing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  {t("doctor.saving")}
                </span>
              ) : (
                t("doctor.confirmPrescription")
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
                  <p className="text-sm font-semibold">{t("doctor.prescriptionSaved")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("doctor.prescriptionSavedDesc")}
                  </p>
                </div>
              </div>
              <Button onClick={() => (window.location.href = "/followup")}>
                {t("doctor.followup")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
