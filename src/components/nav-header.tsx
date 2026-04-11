"use client";

import { cn } from "@/lib/utils";
import { useI18n, type Locale } from "@/lib/i18n";

interface NavHeaderProps {
  currentPage: "patient" | "doctor" | "followup";
}

export function NavHeader({ currentPage }: NavHeaderProps) {
  const { locale, setLocale, t } = useI18n();

  const steps = [
    { id: "patient" as const, label: t("nav.patient"), num: 1 },
    { id: "doctor" as const, label: t("nav.doctor"), num: 2 },
    { id: "followup" as const, label: t("nav.followup"), num: 3 },
  ];

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
            {t("nav.brand")}
          </span>
        </a>

        {/* Progress steps */}
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

        {/* Language switcher */}
        <div className="flex items-center gap-1 shrink-0 ml-3">
          {(["en", "it"] as Locale[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLocale(lang)}
              className={cn(
                "px-2 py-1 rounded text-xs font-semibold uppercase transition-colors cursor-pointer",
                locale === lang
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
