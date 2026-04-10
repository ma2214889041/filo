"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ReasoningStep {
  type: "thinking" | "tool_call" | "tool_result" | "escalation" | "agent_reply" | "error" | "done";
  data: Record<string, unknown>;
}

interface AgentReasoningProps {
  steps: ReasoningStep[];
  isStreaming: boolean;
}

export function AgentReasoning({ steps, isStreaming }: AgentReasoningProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Agent Reasoning
        </h3>
        {isStreaming && (
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
        )}
      </div>

      {steps.map((step, i) => (
        <ReasoningCard key={i} step={step} />
      ))}

      {isStreaming && steps.length === 0 && (
        <div className="text-sm text-muted-foreground animate-pulse">
          Waiting for agent response...
        </div>
      )}
    </div>
  );
}

function ReasoningCard({ step }: { step: ReasoningStep }) {
  switch (step.type) {
    case "thinking":
      return (
        <Card className="border-dashed">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Thinking</Badge>
              <span className="text-sm text-muted-foreground">
                {step.data.message as string}
              </span>
            </div>
          </CardContent>
        </Card>
      );

    case "tool_call":
      return (
        <Card className="border-primary/30">
          <CardHeader className="py-3 px-4 pb-1">
            <div className="flex items-center gap-2">
              <Badge className="text-xs">Tool Call</Badge>
              <CardTitle className="text-sm font-mono">
                {step.data.tool as string}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-2 px-4">
            <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto">
              {JSON.stringify(step.data.args, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );

    case "tool_result":
      return (
        <Card
          className={cn(
            step.data.escalated ? "border-destructive/50 bg-alert-red-light" : ""
          )}
        >
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge
                variant={step.data.escalated ? "destructive" : "secondary"}
                className="text-xs"
              >
                Result
              </Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {step.data.tool as string}
              </span>
            </div>
            <pre className="text-xs text-muted-foreground bg-muted rounded p-2 overflow-x-auto max-h-32">
              {(() => {
                try {
                  return JSON.stringify(JSON.parse(step.data.result as string), null, 2);
                } catch {
                  return step.data.result as string;
                }
              })()}
            </pre>
          </CardContent>
        </Card>
      );

    case "escalation":
      return (
        <Card className="border-destructive bg-alert-red-light">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs font-bold">
                GP ESCALATION
              </Badge>
              <span className="text-sm font-medium text-destructive">
                {step.data.reason as string}
              </span>
            </div>
            <div className="text-xs mt-1 text-destructive">
              Urgency: {(step.data.urgency as string)?.toUpperCase()}
            </div>
          </CardContent>
        </Card>
      );

    case "agent_reply":
      return (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="text-xs">Agent Reply</Badge>
            </div>
            <p className="text-sm">{step.data.message as string}</p>
          </CardContent>
        </Card>
      );

    case "error":
      return (
        <Card className="border-destructive">
          <CardContent className="py-3 px-4">
            <Badge variant="destructive" className="text-xs">Error</Badge>
            <p className="text-sm text-destructive mt-1">
              {step.data.message as string}
            </p>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}
