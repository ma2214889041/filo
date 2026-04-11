"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NavHeader } from "@/components/nav-header";
import { DEMO_PATIENT } from "@/data/demo-patient";

export default function PatientPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  const [symptoms, setSymptoms] = useState("");
  const [temperature, setTemperature] = useState("");
  const [daysSick, setDaysSick] = useState("");
  const [age, setAge] = useState("");

  function prefillDemo() {
    setSymptoms(DEMO_PATIENT.symptoms);
    setTemperature(String(DEMO_PATIENT.temperature));
    setDaysSick(String(DEMO_PATIENT.daysSick));
    setAge(String(DEMO_PATIENT.age));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      setLoadingStep("Extracting clinical criteria...");
      const intakeRes = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptoms || DEMO_PATIENT.symptoms,
          temperature: parseFloat(temperature) || DEMO_PATIENT.temperature,
          daysSick: parseInt(daysSick) || DEMO_PATIENT.daysSick,
          age: parseInt(age) || DEMO_PATIENT.age,
          patientName: DEMO_PATIENT.name,
        }),
      });

      if (!intakeRes.ok) {
        const err = await intakeRes.json();
        throw new Error(err.error || "Intake failed");
      }

      const intakeData = await intakeRes.json();

      setLoadingStep("Computing McIsaac score & clinical summary...");
      const reasonRes = await fetch("/api/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          criteria: intakeData.criteria,
          patientContext: {
            name: DEMO_PATIENT.name,
            age: parseInt(age) || DEMO_PATIENT.age,
            sex: DEMO_PATIENT.sex,
            symptoms: symptoms || DEMO_PATIENT.symptoms,
            temperature: parseFloat(temperature) || DEMO_PATIENT.temperature,
            daysSick: parseInt(daysSick) || DEMO_PATIENT.daysSick,
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
            age: parseInt(age) || DEMO_PATIENT.age,
            sex: DEMO_PATIENT.sex,
            chiefComplaint: DEMO_PATIENT.chiefComplaint,
            symptoms: symptoms || DEMO_PATIENT.symptoms,
          },
          criteria: intakeData.criteria,
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <NavHeader currentPage="patient" />
        <div className="flex items-center justify-center p-4 mt-16">
          <Card className="w-full max-w-md text-center shadow-lg">
            <CardContent className="pt-10 pb-8 space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-score-green/10 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-score-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Dati Inviati con Successo
                </h2>
                <p className="text-sm text-muted-foreground">
                  I dati clinici della paziente sono stati analizzati e inviati
                  alla dashboard del medico.
                </p>
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => (window.location.href = "/doctor")}
              >
                Vai alla Dashboard del Medico →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavHeader currentPage="patient" />

      <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-4 sm:mt-8">
        {/* Hero 区域 */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            Demo — Acute Pharyngitis Workflow
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Modulo di Accettazione
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            La paziente descrive i propri sintomi. I dati vengono analizzati
            dall&apos;AI e inviati al medico curante.
          </p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Dati del Paziente</CardTitle>
                <CardDescription>
                  Compili il modulo o utilizzi i dati demo precompilati.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={prefillDemo}>
                Pre-fill Demo
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nome */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold text-sm">MR</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">{DEMO_PATIENT.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Patient ID: {DEMO_PATIENT.id}
                  </p>
                </div>
              </div>

              {/* Sintomi */}
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Descrizione Sintomi
                </label>
                <Textarea
                  placeholder="Descriva i suoi sintomi in italiano..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Campi strutturati */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Temp. (°C)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="35"
                    max="42"
                    placeholder={String(DEMO_PATIENT.temperature)}
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Giorni malattia
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    placeholder={String(DEMO_PATIENT.daysSick)}
                    value={daysSick}
                    onChange={(e) => setDaysSick(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Età
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="120"
                    placeholder={String(DEMO_PATIENT.age)}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="opacity-75"
                      />
                    </svg>
                    {loadingStep}
                  </span>
                ) : (
                  "Invia al Medico"
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                I campi vuoti utilizzeranno i dati demo di Marta Rossi.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
