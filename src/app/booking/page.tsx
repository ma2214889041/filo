"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavHeader } from "@/components/nav-header";
import { DEMO_PATIENT } from "@/data/demo-patient";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ================================================================
   Simulated GP availability
   ================================================================ */

/** Generate fake availability for the next 7 days.
 *  Some slots are "booked" to look realistic. */
function buildAvailability(): Record<string, { time: string; status: "available" | "booked" }[]> {
  const ALL_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  ];
  // deterministic "booked" pattern per day offset
  const BOOKED_PATTERN: Record<number, number[]> = {
    0: [0, 3, 7, 10],      // today: 4 booked
    1: [1, 4, 5, 8, 9],    // tomorrow: 5 booked
    2: [2, 6, 11],          // day+2: 3 booked
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // day+3: fully booked
    4: [3, 7],              // day+4: 2 booked
    5: [],                  // day+5: all free (weekend?)
    6: [0, 1, 5, 9, 10],   // day+6: 5 booked
  };

  const result: Record<string, { time: string; status: "available" | "booked" }[]> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split("T")[0];
    const booked = BOOKED_PATTERN[i] || [];
    result[key] = ALL_SLOTS.map((time, idx) => ({
      time,
      status: booked.includes(idx) ? "booked" as const : "available" as const,
    }));
  }
  return result;
}

/* ================================================================
   Main Page
   ================================================================ */

export default function BookingPage() {
  const { t, locale } = useI18n();

  // Read visit type from URL params
  const visitType = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("type") || "video"
    : "video";

  const availability = useMemo(() => buildAvailability(), []);
  const dateKeys = Object.keys(availability);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const slotsForDate = selectedDate ? availability[selectedDate] || [] : [];
  const availableCount = slotsForDate.filter((s) => s.status === "available").length;
  const isFullyBooked = selectedDate ? availableCount === 0 : false;

  function handleBook() {
    if (!selectedDate || !selectedTime) return;
    // Store in sessionStorage for other pages
    sessionStorage.setItem(
      "persana_booking",
      JSON.stringify({ visitType, date: selectedDate, time: selectedTime })
    );
    setBooked(true);
  }

  /* ---- Booked confirmation ---- */
  if (booked) {
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
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {t("booking.confirmed")}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("booking.confirmedDesc")}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
                  <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-sm font-semibold text-primary">
                    {visitType === "video" ? t("booking.videoCall") : t("booking.inPerson")}
                    {" — "}
                    {new Date(selectedDate!).toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
                      weekday: "long", day: "numeric", month: "long",
                    })}
                    {" "}{t("booking.atTime")}{" "}{selectedTime}
                  </span>
                </div>
              </div>
              <Button size="lg" className="w-full" onClick={() => window.close()}>
                {t("booking.close")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  /* ---- Main booking UI ---- */
  return (
    <div className="min-h-screen bg-background">
      <NavHeader currentPage="patient" />

      <div className="max-w-3xl mx-auto p-4 sm:p-6 mt-4 sm:mt-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            {visitType === "video" ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
            )}
            {visitType === "video" ? t("booking.videoCall") : t("booking.inPerson")}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("booking.title")}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("booking.subtitle")}
          </p>
        </div>

        {/* Patient info */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-primary font-semibold text-sm">MR</span>
          </div>
          <div>
            <p className="font-semibold text-sm">{DEMO_PATIENT.name}</p>
            <p className="text-xs text-muted-foreground">
              {DEMO_PATIENT.age}{DEMO_PATIENT.sex} &middot; {DEMO_PATIENT.chiefComplaint}
            </p>
          </div>
        </div>

        {/* Date picker */}
        <Card className="shadow-lg border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("booking.selectDate")}</CardTitle>
            <CardDescription>{t("booking.selectDateDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dateKeys.map((dateStr, i) => {
                const d = new Date(dateStr + "T12:00:00");
                const isSelected = selectedDate === dateStr;
                const isToday = i === 0;
                const dayAvail = availability[dateStr];
                const dayAvailCount = dayAvail.filter((s) => s.status === "available").length;
                const dayFull = dayAvailCount === 0;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      if (!dayFull) {
                        setSelectedDate(dateStr);
                        setSelectedTime(null);
                      }
                    }}
                    disabled={dayFull}
                    className={cn(
                      "flex flex-col items-center px-4 py-3 rounded-xl border-2 min-w-[80px] transition-all shrink-0",
                      dayFull
                        ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                        : isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30 cursor-pointer"
                          : "border-border hover:border-primary/30 cursor-pointer"
                    )}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground uppercase">
                      {d.toLocaleDateString(locale === "it" ? "it-IT" : "en-US", { weekday: "short" })}
                    </span>
                    <span className={cn("text-lg font-bold", isSelected ? "text-primary" : dayFull ? "text-muted-foreground" : "text-foreground")}>
                      {d.getDate()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {d.toLocaleDateString(locale === "it" ? "it-IT" : "en-US", { month: "short" })}
                    </span>
                    {isToday && (
                      <span className="text-[8px] font-bold text-primary mt-0.5">
                        {locale === "it" ? "OGGI" : "TODAY"}
                      </span>
                    )}
                    {dayFull ? (
                      <span className="text-[8px] font-bold text-score-red mt-0.5">
                        {t("booking.full")}
                      </span>
                    ) : (
                      <span className="text-[8px] text-muted-foreground mt-0.5">
                        {dayAvailCount} {t("booking.slotsAvailable")}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Time slots */}
        {selectedDate && (
          <Card className="shadow-lg border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t("booking.selectTime")}</CardTitle>
              <CardDescription>
                {isFullyBooked
                  ? t("booking.noSlots")
                  : `${availableCount} ${t("booking.slotsAvailable")} — ${new Date(selectedDate + "T12:00:00").toLocaleDateString(
                      locale === "it" ? "it-IT" : "en-US",
                      { weekday: "long", day: "numeric", month: "long" }
                    )}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Morning */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("booking.morning")}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                {slotsForDate.filter((s) => parseInt(s.time) < 12).map((slot) => {
                  const isBooked = slot.status === "booked";
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                        isBooked
                          ? "border-border bg-muted/50 text-muted-foreground/40 line-through cursor-not-allowed"
                          : isSelected
                            ? "border-primary bg-primary text-primary-foreground cursor-pointer"
                            : "border-border hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
                      )}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>

              {/* Afternoon */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t("booking.afternoon")}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {slotsForDate.filter((s) => parseInt(s.time) >= 12).map((slot) => {
                  const isBooked = slot.status === "booked";
                  const isSelected = selectedTime === slot.time;
                  return (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setSelectedTime(slot.time)}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border text-sm font-medium transition-all",
                        isBooked
                          ? "border-border bg-muted/50 text-muted-foreground/40 line-through cursor-not-allowed"
                          : isSelected
                            ? "border-primary bg-primary text-primary-foreground cursor-pointer"
                            : "border-border hover:border-primary/30 hover:bg-muted/30 cursor-pointer"
                      )}
                    >
                      {slot.time}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border border-border" />
                  <span className="text-xs text-muted-foreground">{t("booking.available")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-muted border border-border" />
                  <span className="text-xs text-muted-foreground line-through">{t("booking.booked")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-primary" />
                  <span className="text-xs text-muted-foreground">{t("booking.yourChoice")}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Confirm booking */}
        {selectedDate && selectedTime && (
          <Card className="shadow-lg border-primary/20 bg-primary/5">
            <CardContent className="py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold">
                      {visitType === "video" ? t("booking.videoCall") : t("booking.inPerson")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString(locale === "it" ? "it-IT" : "en-US", {
                        weekday: "long", day: "numeric", month: "long",
                      })}
                      {" "}{t("booking.atTime")}{" "}{selectedTime}
                    </p>
                  </div>
                </div>
                <Button onClick={handleBook}>{t("booking.confirm")}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="h-8" />
      </div>
    </div>
  );
}
