"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
      className={`transition-all ${selected ? "ring-2 ring-primary" : "hover:shadow-md"}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{drug.name}</CardTitle>
          <Badge variant="secondary">{drug.line}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Dose:</span>{" "}
            <span className="font-medium">{drug.dose}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Duration:</span>{" "}
            <span className="font-medium">{drug.duration}</span>
          </div>
        </div>

        {drug.contraindication && (
          <div className="text-xs text-destructive bg-alert-red-light px-2 py-1 rounded">
            Contraindication: {drug.contraindication}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{rationale}</p>

        <Button
          className="w-full"
          variant={selected ? "default" : "outline"}
          onClick={() => onSelect(drugId)}
          disabled={disabled}
        >
          {selected ? "Selected" : "Select Prescription"}
        </Button>
      </CardContent>
    </Card>
  );
}
