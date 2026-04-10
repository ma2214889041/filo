"use client";

import { cn } from "@/lib/utils";

interface CentorGaugeProps {
  score: number;
  className?: string;
}

export function CentorGauge({ score, className }: CentorGaugeProps) {
  const getColor = (s: number) => {
    if (s <= 1) return "text-score-green";
    if (s <= 3) return "text-score-yellow";
    return "text-score-red";
  };

  const getBgColor = (s: number) => {
    if (s <= 1) return "bg-score-green";
    if (s <= 3) return "bg-score-yellow";
    return "bg-score-red";
  };

  const getLabel = (s: number) => {
    if (s <= 1) return "Low Risk";
    if (s <= 3) return "Moderate Risk";
    return "High Risk";
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
        McIsaac Score
      </div>
      <div className={cn("text-7xl font-bold", getColor(score))}>{score}</div>
      <div className="text-sm text-muted-foreground">/5</div>

      {/* 视觉进度条 */}
      <div className="w-full max-w-[200px] h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getBgColor(score))}
          style={{ width: `${(score / 5) * 100}%` }}
        />
      </div>

      <div
        className={cn(
          "text-sm font-semibold px-3 py-1 rounded-full",
          score <= 1 && "bg-score-green/10 text-score-green",
          score >= 2 && score <= 3 && "bg-score-yellow/10 text-score-yellow",
          score >= 4 && "bg-score-red/10 text-score-red"
        )}
      >
        {getLabel(score)}
      </div>
    </div>
  );
}
