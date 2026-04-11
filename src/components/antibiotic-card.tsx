"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ANTIBIOTICS } from "@/data/antibiotics";

interface AntibioticCardProps {
  drugId: string;
  rationale: string;
  onSelect: (drugId: string) => void;
  disabled?: boolean;
  selected?: boolean;
}

export function AntibioticCard({
  drugId,
  rationale,
  onSelect,
  disabled,
  selected,
}: AntibioticCardProps) {
  const drug = ANTIBIOTICS.find((a) => a.id === drugId);
  if (!drug) return null;

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer group",
        selected
          ? "ring-2 ring-primary shadow-md"
          : "hover:shadow-md hover:border-primary/30",
        disabled && "opacity-60 cursor-default"
      )}
      onClick={() => !disabled && onSelect(drugId)}
    >
      <CardContent className="p-5 space-y-3">
        {/* 头部 */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-base">{drug.name}</h3>
            <Badge
              variant="secondary"
              className="mt-1 text-[10px] font-medium"
            >
              {drug.line}
            </Badge>
          </div>
          {/* 选择指示器 */}
          <div
            className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-0.5",
              selected
                ? "border-primary bg-primary"
                : "border-muted-foreground/30 group-hover:border-primary/50"
            )}
          >
            {selected && (
              <svg
                className="w-3 h-3 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>

        {/* 剂量信息 */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <div>
            <span className="text-muted-foreground text-xs block">Dose</span>
            <span className="font-semibold text-sm">{drug.dose}</span>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Duration</span>
            <span className="font-semibold text-sm">{drug.duration}</span>
          </div>
        </div>

        {/* 禁忌 */}
        {drug.contraindication && (
          <div className="flex items-center gap-1.5 text-xs text-destructive bg-alert-red-light rounded-md px-2.5 py-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
            </svg>
            <span>{drug.contraindication}</span>
          </div>
        )}

        {/* 描述 */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {rationale}
        </p>

        {/* 选择按钮 */}
        <Button
          className="w-full"
          variant={selected ? "default" : "outline"}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onSelect(drugId);
          }}
          disabled={disabled}
        >
          {selected ? "Selected" : "Select"}
        </Button>
      </CardContent>
    </Card>
  );
}
