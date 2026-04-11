"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { NavHeader } from "@/components/nav-header";
import { DEMO_PATIENT } from "@/data/demo-patient";
import { useI18n } from "@/lib/i18n";

/* ================================================================
   Types & Helpers
   ================================================================ */

interface Prescription {
  drugName: string;
  dose: string;
  duration: string;
  prescribedAt: string;
  centorScore: number;
}

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? parseInt(match[1]) : 10;
}

function formatDate(base: Date, dayOffset: number, locale: string): string {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  return d.toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

/** Create a date N days before today */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const STORAGE_KEY = "persana_adherence_checks";

/* ================================================================
   Main Component
   ================================================================ */

export default function FollowupPage() {
  const { t, locale } = useI18n();

  // --- Prescription data ---
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [seeded, setSeeded] = useState(false);

  // --- Checklist state: checks[dayIndex][doseIndex] ---
  const [checks, setChecks] = useState<boolean[][]>([]);

  // --- Escalation ---
  const [showEscalation, setShowEscalation] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const [escalationDetails, setEscalationDetails] = useState("");
  const [escalationImage, setEscalationImage] = useState<string | null>(null);
  const [escalationSending, setEscalationSending] = useState(false);
  const [escalationSent, setEscalationSent] = useState(false);
  const [gpAlert, setGpAlert] = useState<{
    reason: string;
    urgency: string;
  } | null>(null);
  const escalationFileRef = useRef<HTMLInputElement>(null);

  // --- Feedback ---
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);

  // --- Dose labels (translated) ---
  function getDoseLabels(dose: string): string[] {
    if (/TID/i.test(dose))
      return [
        t("followup.morning"),
        t("followup.afternoon"),
        t("followup.evening"),
      ];
    if (/BID/i.test(dose))
      return [t("followup.morning"), t("followup.evening")];
    return [t("followup.morning")];
  }

  // --- Escalation issues (translated) ---
  const ESCALATION_ISSUES = [
    { id: "rash", label: t("followup.issueRash"), urgency: "high" as const },
    {
      id: "breathing",
      label: t("followup.issueBreathing"),
      urgency: "high" as const,
    },
    {
      id: "swelling",
      label: t("followup.issueSwelling"),
      urgency: "high" as const,
    },
    {
      id: "worsening",
      label: t("followup.issueWorsening"),
      urgency: "high" as const,
    },
    {
      id: "fever",
      label: t("followup.issueFever"),
      urgency: "high" as const,
    },
    {
      id: "side_effects",
      label: t("followup.issueSideEffects"),
      urgency: "medium" as const,
    },
    {
      id: "other",
      label: t("followup.issueOther"),
      urgency: "medium" as const,
    },
  ];

  // --- Derived ---
  const doseLabels = prescription ? getDoseLabels(prescription.dose) : [];
  const doseCount = prescription
    ? /TID/i.test(prescription.dose)
      ? 3
      : /BID/i.test(prescription.dose)
        ? 2
        : 1
    : 0;
  const totalDays = prescription ? parseDuration(prescription.duration) : 0;
  const startDate = prescription
    ? new Date(prescription.prescribedAt)
    : new Date();

  const completedDays = checks.filter(
    (day) => day.length > 0 && day.every(Boolean)
  ).length;
  const totalDoses = totalDays * doseCount;
  const checkedDoses = checks.flat().filter(Boolean).length;
  const treatmentComplete = totalDays > 0 && completedDays >= totalDays;

  // --- Elapsed days since prescription start ---
  const elapsedDays = (() => {
    if (!prescription) return 0;
    const start = new Date(prescription.prescribedAt);
    start.setHours(0, 0, 0, 0);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
  })();

  const todayIndex = Math.min(Math.max(elapsedDays, 0), totalDays - 1);

  // --- Load prescription on mount ---
  useEffect(() => {
    const rxStored = sessionStorage.getItem("persana_prescription");
    if (rxStored) {
      try {
        const rx = JSON.parse(rxStored) as Prescription;
        setPrescription(rx);
        setSeeded(true);
        return;
      } catch {
        /* fall through */
      }
    }

    // Demo fallback: prescription started 4 days ago so auto-check works
    fetch("/api/seed", { method: "POST" })
      .then(() => {
        setPrescription({
          drugName: "Amoxicillin",
          dose: "1g BID",
          duration: "5 days",
          prescribedAt: daysAgo(4),
          centorScore: 4,
        });
        setSeeded(true);
      })
      .catch(() => {
        setPrescription({
          drugName: "Amoxicillin",
          dose: "1g BID",
          duration: "5 days",
          prescribedAt: daysAgo(4),
          centorScore: 4,
        });
        setSeeded(true);
      });
  }, []);

  // --- Initialize checks, auto-check past days ---
  useEffect(() => {
    if (!seeded || totalDays === 0 || doseCount === 0) return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as boolean[][];
        if (
          parsed.length === totalDays &&
          parsed[0]?.length === doseCount
        ) {
          setChecks(parsed);
          return;
        }
      } catch {
        /* ignore */
      }
    }
    // Auto-check all days before today
    setChecks(
      Array.from({ length: totalDays }, (_, dayIdx) =>
        Array(doseCount).fill(dayIdx < elapsedDays)
      )
    );
  }, [seeded, totalDays, doseCount, elapsedDays]);

  // --- Persist checks ---
  useEffect(() => {
    if (checks.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    }
  }, [checks]);

  const toggleCheck = useCallback(
    (dayIndex: number, doseIndex: number) => {
      setChecks((prev) => {
        const next = prev.map((row) => [...row]);
        next[dayIndex][doseIndex] = !next[dayIndex][doseIndex];
        return next;
      });
    },
    []
  );

  // --- Escalation ---
  function handleEscalationImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEscalationImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitEscalation() {
    if (!selectedIssue) return;
    setEscalationSending(true);
    const issue = ESCALATION_ISSUES.find((i) => i.id === selectedIssue);
    try {
      const res = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: DEMO_PATIENT.id,
          reason: issue?.label || selectedIssue,
          urgency: issue?.urgency || "medium",
          details: escalationDetails,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setGpAlert({ reason: data.alert.reason, urgency: data.alert.urgency });
      setEscalationSent(true);
    } catch {
      alert("Error");
    } finally {
      setEscalationSending(false);
    }
  }

  // --- Feedback ---
  async function submitFeedback() {
    if (feedbackRating === 0) return;
    setFeedbackSending(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: DEMO_PATIENT.id,
          rating: feedbackRating,
          comment: feedbackComment,
          completedDays,
          totalDays,
        }),
      });
      setFeedbackSent(true);
    } catch {
      alert("Error");
    } finally {
      setFeedbackSending(false);
    }
  }

  // --- Loading ---
  if (!seeded || !prescription) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader currentPage="followup" />
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">
            {t("followup.loadingPrescription")}
          </p>
        </div>
      </div>
    );
  }

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="min-h-screen bg-background">
      <NavHeader currentPage="followup" />

      {/* GP Alert Banner */}
      {gpAlert && (
        <div className="bg-destructive text-destructive-foreground py-3 px-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                />
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg">
                {t("followup.alertSent")}
              </div>
              <div className="text-sm opacity-90">
                {gpAlert.reason} — {t("followup.urgencyLabel")}:{" "}
                <span className="font-bold">
                  {gpAlert.urgency.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-4 sm:mt-8 space-y-6">
        {/* ---- PRESCRIPTION SUMMARY ---- */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">
                  {prescription.drugName}
                </CardTitle>
                <CardDescription>
                  {prescription.dose} &middot; {prescription.duration} &middot;{" "}
                  {DEMO_PATIENT.name}
                </CardDescription>
              </div>
              {treatmentComplete && (
                <span className="px-3 py-1 rounded-full bg-score-green/10 text-score-green text-sm font-semibold">
                  {t("followup.completed")}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("followup.progressLabel")}
                </span>
                <span className="font-semibold">
                  {checkedDoses}/{totalDoses} {t("followup.doses")} &middot;{" "}
                  {t("followup.dayOf")} {Math.min(todayIndex + 1, totalDays)}{" "}
                  {t("followup.of")} {totalDays}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${totalDoses > 0 ? (checkedDoses / totalDoses) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---- DAILY CHECKLIST ---- */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {t("followup.checklistTitle")}
            </CardTitle>
            <CardDescription>{t("followup.checklistDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {checks.map((dayChecks, dayIndex) => {
                const dayComplete = dayChecks.every(Boolean);
                const anyChecked = dayChecks.some(Boolean);
                const isToday = dayIndex === todayIndex;

                return (
                  <div
                    key={dayIndex}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isToday
                        ? "bg-primary/5 border border-primary/20"
                        : dayComplete
                          ? "bg-score-green/5"
                          : "hover:bg-muted/30"
                    }`}
                  >
                    <div className="w-28 shrink-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${
                            isToday
                              ? "text-primary"
                              : dayComplete
                                ? "text-score-green"
                                : "text-foreground"
                          }`}
                        >
                          {t("followup.dayOf")} {dayIndex + 1}
                        </span>
                        {isToday && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                            {t("followup.today")}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(startDate, dayIndex, locale)}
                      </span>
                    </div>

                    <div className="flex gap-2 flex-1">
                      {dayChecks.map((checked, doseIndex) => (
                        <button
                          key={doseIndex}
                          type="button"
                          onClick={() => toggleCheck(dayIndex, doseIndex)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-all cursor-pointer ${
                            checked
                              ? "bg-score-green/10 border-score-green/30 text-score-green"
                              : "bg-background border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                              checked
                                ? "bg-score-green border-score-green"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {checked && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs font-medium">
                            {doseLabels[doseIndex]}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="w-8 shrink-0 flex justify-center">
                      {dayComplete ? (
                        <svg
                          className="w-5 h-5 text-score-green"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : anyChecked ? (
                        <div className="w-5 h-5 rounded-full border-2 border-score-yellow flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-score-yellow" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-border" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ---- ESCALATION ---- */}
        <Card
          className={`shadow-lg border-border/50 ${showEscalation ? "border-score-red/30" : ""}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-score-red/10 flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-score-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"
                    />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg text-score-red">
                    {t("followup.escalateTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("followup.escalateDesc")}
                  </CardDescription>
                </div>
              </div>
              {!showEscalation && !escalationSent && (
                <Button
                  variant="outline"
                  className="border-score-red/30 text-score-red hover:bg-score-red/10"
                  onClick={() => setShowEscalation(true)}
                >
                  {t("followup.escalateBtn")}
                </Button>
              )}
            </div>
          </CardHeader>

          {showEscalation && !escalationSent && (
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  {t("followup.issueType")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ESCALATION_ISSUES.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => setSelectedIssue(issue.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left transition-all cursor-pointer ${
                        selectedIssue === issue.id
                          ? issue.urgency === "high"
                            ? "border-score-red bg-score-red/10 text-score-red ring-1 ring-score-red/30"
                            : "border-score-yellow bg-score-yellow/10 text-score-yellow ring-1 ring-score-yellow/30"
                          : "border-border hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          issue.urgency === "high"
                            ? "bg-score-red"
                            : "bg-score-yellow"
                        }`}
                      />
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t("followup.describeSymptoms")}
                </label>
                <Textarea
                  rows={3}
                  placeholder={t("followup.describePlaceholder")}
                  value={escalationDetails}
                  onChange={(e) => setEscalationDetails(e.target.value)}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t("followup.photo")}
                </label>
                {escalationImage ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
                    <img
                      src={escalationImage}
                      alt="Preview"
                      className="w-16 h-16 rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEscalationImage(null);
                        if (escalationFileRef.current)
                          escalationFileRef.current.value = "";
                      }}
                    >
                      {t("common.remove")}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => escalationFileRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-score-red/30 transition-colors cursor-pointer"
                  >
                    <svg
                      className="w-5 h-5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                      />
                    </svg>
                    <span className="text-sm text-muted-foreground">
                      {t("followup.photoClick")}
                    </span>
                  </button>
                )}
                <input
                  ref={escalationFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEscalationImage}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-score-red hover:bg-score-red/90 text-white"
                  disabled={!selectedIssue || escalationSending}
                  onClick={submitEscalation}
                >
                  {escalationSending
                    ? t("followup.sending")
                    : t("followup.sendEscalation")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowEscalation(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            </CardContent>
          )}

          {escalationSent && (
            <CardContent>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-score-green/10 border border-score-green/20">
                <svg
                  className="w-6 h-6 text-score-green shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-sm">
                    {t("followup.escalationSuccess")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("followup.escalationSuccessDesc")}
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ---- TREATMENT COMPLETE + FEEDBACK ---- */}
        {treatmentComplete && (
          <Card className="shadow-lg border-score-green/30 bg-score-green/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-score-green/10 flex items-center justify-center shrink-0">
                  <svg
                    className="w-7 h-7 text-score-green"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg text-score-green">
                    {t("followup.treatmentComplete")}
                  </CardTitle>
                  <CardDescription>
                    {t("followup.treatmentCompleteDesc").replace(
                      "{days}",
                      String(totalDays)
                    )}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {!feedbackSent ? (
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-3">
                    {t("followup.feedbackQuestion")}
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="cursor-pointer p-1 transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 transition-colors ${
                            star <= feedbackRating
                              ? "text-score-yellow fill-score-yellow"
                              : "text-muted-foreground/30"
                          }`}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    {t("followup.feedbackComment")}
                  </label>
                  <Textarea
                    rows={3}
                    placeholder={t("followup.feedbackPlaceholder")}
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    className="resize-none"
                  />
                </div>

                <Button
                  className="w-full"
                  disabled={feedbackRating === 0 || feedbackSending}
                  onClick={submitFeedback}
                >
                  {feedbackSending
                    ? t("followup.sending")
                    : t("followup.sendFeedback")}
                </Button>
              </CardContent>
            ) : (
              <CardContent>
                <div className="text-center py-4">
                  <p className="font-semibold text-score-green">
                    {t("followup.feedbackThanks")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("followup.feedbackThanksDesc")}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
