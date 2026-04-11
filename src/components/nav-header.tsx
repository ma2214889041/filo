"use client";

import { cn } from "@/lib/utils";

interface NavHeaderProps {
  currentPage: "patient" | "doctor" | "followup";
}

const steps = [
  { id: "patient" as const, label: "Patient Intake", num: 1 },
  { id: "doctor" as const, label: "GP Dashboard", num: 2 },
  { id: "followup" as const, label: "Follow-up", num: 3 },
];

export function NavHeader({ currentPage }: NavHeaderProps) {
  const currentIdx = steps.findIndex((s) => s.id === currentPage);

  return (
    <header className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <a href="/patient" className="flex items-center gap-2.5 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">P</span>
          </div>
          <span className="font-semibold text-primary text-lg hidden sm:inline">
            Persana Health
          </span>
        </a>

        {/* 进度步骤 */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {steps.map((step, i) => (
            <a
              key={step.id}
              href={`/${step.id}`}
              className="flex items-center gap-1 sm:gap-2"
            >
              {i > 0 && (
                <div
                  className={cn(
                    "w-6 sm:w-10 h-[2px]",
                    i <= currentIdx ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                    step.id === currentPage
                      ? "bg-primary text-primary-foreground"
                      : i < currentIdx
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.num}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden md:inline",
                    step.id === currentPage
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
