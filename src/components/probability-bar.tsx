"use client";

import { cn } from "@/lib/utils";

interface ProbabilityBarProps {
  probability: "likely viral" | "uncertain" | "likely bacterial";
  className?: string;
}

export function ProbabilityBar({ probability, className }: ProbabilityBarProps) {
  const getPosition = () => {
    if (probability === "likely viral") return 15;
    if (probability === "uncertain") return 50;
    return 85;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">
        Probability Assessment
      </div>

      <div className="relative">
        {/* 渐变条 */}
        <div className="h-6 rounded-full bg-gradient-to-r from-score-green via-score-yellow to-score-red opacity-80" />

        {/* 指示器 */}
        <div
          className="absolute top-0 h-6 w-1 bg-foreground rounded-full transition-all duration-500"
          style={{ left: `${getPosition()}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Viral</span>
        <span>Uncertain</span>
        <span>Bacterial</span>
      </div>

      <div className="text-center">
        <span
          className={cn(
            "text-sm font-semibold px-3 py-1 rounded-full",
            probability === "likely viral" && "bg-score-green/10 text-score-green",
            probability === "uncertain" && "bg-score-yellow/10 text-score-yellow",
            probability === "likely bacterial" && "bg-score-red/10 text-score-red"
          )}
        >
          {probability.charAt(0).toUpperCase() + probability.slice(1)}
        </span>
      </div>
    </div>
  );
}
