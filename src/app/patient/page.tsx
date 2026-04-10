"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DEMO_PATIENT } from "@/data/demo-patient";

export default function PatientPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [symptoms, setSymptoms] = useState("");
  const [temperature, setTemperature] = useState("");
  const [daysSick, setDaysSick] = useState("");
  const [age, setAge] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // 调用 Intake Agent API
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

      // 调用 Clinical Reasoning API
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

      // 存储到 sessionStorage 供 /doctor 页面使用
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
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-primary">Dati Inviati</CardTitle>
            <CardDescription>
              I tuoi dati sono stati inviati al medico con successo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl">✓</div>
            <p className="text-muted-foreground text-sm">
              Il Dott. vedrà i tuoi sintomi e le informazioni cliniche nella sua dashboard.
              Riceverai indicazioni a breve.
            </p>
            <Button variant="outline" onClick={() => (window.location.href = "/doctor")}>
              Vai alla Dashboard del Medico →
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="text-sm font-medium text-primary tracking-widest uppercase mb-2">
            Persana Health
          </div>
          <CardTitle>Modulo di Accettazione Paziente</CardTitle>
          <CardDescription>
            Descriva i suoi sintomi per aiutare il medico nella valutazione.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Nome Paziente
              </label>
              <Input value={DEMO_PATIENT.name} disabled className="bg-muted" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Descrizione Sintomi
              </label>
              <Textarea
                placeholder={DEMO_PATIENT.symptoms}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Descriva come si sente: dolore, febbre, altri sintomi...
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Temperatura (°C)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={String(DEMO_PATIENT.temperature)}
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Giorni di malattia
                </label>
                <Input
                  type="number"
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
                  placeholder={String(DEMO_PATIENT.age)}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Invio in corso..." : "Invia al Medico"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
