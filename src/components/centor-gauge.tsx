"use client";

import { cn } from "@/lib/utils";

interface CentorGaugeProps {
  score: number;
  breakdown?: {
    tonsillarExudate: number;
    tenderNodes: number;
    fever: number;
    absenceOfCough: number;
    ageModifier: number;
  };
  className?: string;
}

export function CentorGauge({ score, breakdown, className }: CentorGaugeProps) {
  const getColor = (s: number) => {
    if (s <= 1) return { text: "text-score-green", bg: "bg-score-green", stroke: "#16a34a" };
    if (s <= 3) return { text: "text-score-yellow", bg: "bg-score-yellow", stroke: "#ca8a04" };
    return { text: "text-score-red", bg: "bg-score-red", stroke: "#dc2626" };
  };

  const getLabel = (s: number) => {
    if (s <= 1) return "Low Risk";
    if (s <= 3) return "Moderate";
    return "High Risk";
  };

  const color = getColor(score);
  const pct = (score / 5) * 100;

  // SVG 圆弧参数
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270度弧
  const filledLength = arcLength * (pct / 100);

  const breakdownItems = breakdown
    ? [
        { label: "Tonsillar exudate", value: breakdown.tonsillarExudate, max: 1 },
        { label: "Tender cervical nodes", value: breakdown.tenderNodes, max: 1 },
        { label: "Fever >38°C", value: breakdown.fever, max: 1 },
        { label: "Absence of cough", value: breakdown.absenceOfCough, max: 1 },
        {
          label: `Age modifier`,
          value: breakdown.ageModifier,
          max: 1,
          showSign: true,
        },
      ]
    : null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* SVG 圆弧仪表 */}
      <div className="relative w-40 h-36">
        <svg viewBox="0 0 128 112" className="w-full h-full">
          {/* 背景弧 */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-muted"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform="rotate(135 64 64)"
          />
          {/* 填充弧 */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color.stroke}
            strokeWidth="10"
            strokeDasharray={`${filledLength} ${circumference}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform="rotate(135 64 64)"
            style={{ transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        {/* 中间数字 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className={cn("text-5xl font-extrabold tabular-nums", color.text)}>
            {score}
          </span>
          <span className="text-xs text-muted-foreground -mt-1">/5</span>
        </div>
      </div>

      {/* 标签 */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm font-medium text-muted-foreground">McIsaac Score</span>
        <span
          className={cn(
            "text-xs font-bold px-2 py-0.5 rounded-full",
            score <= 1 && "bg-score-green/10 text-score-green",
            score >= 2 && score <= 3 && "bg-score-yellow/10 text-score-yellow",
            score >= 4 && "bg-score-red/10 text-score-red"
          )}
        >
          {getLabel(score)}
        </span>
      </div>

      {/* 评分细项 */}
      {breakdownItems && (
        <div className="w-full mt-4 space-y-1.5">
          {breakdownItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between text-xs px-1"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span
                className={cn(
                  "font-semibold tabular-nums",
                  item.value > 0 ? color.text : "text-muted-foreground"
                )}
              >
                {item.showSign && item.value >= 0 ? "+" : ""}
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
