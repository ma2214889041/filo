"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ReasoningStep {
  type:
    | "thinking"
    | "tool_call"
    | "tool_result"
    | "escalation"
    | "agent_reply"
    | "error"
    | "done";
  data: Record<string, unknown>;
}

interface AgentReasoningProps {
  steps: ReasoningStep[];
  isStreaming: boolean;
}

export function AgentReasoning({ steps, isStreaming }: AgentReasoningProps) {
  return (
    <div className="space-y-2.5">
      {steps.length === 0 && !isStreaming && (
        <div className="text-center py-12 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">
            Agent reasoning will appear here when a message is sent.
          </p>
        </div>
      )}

      {isStreaming && steps.length === 0 && (
        <div className="flex items-center gap-2 py-4">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-sm text-muted-foreground">Agent thinking...</span>
        </div>
      )}

      {steps.map((step, i) => (
        <ReasoningCard key={i} step={step} />
      ))}

      {isStreaming && steps.length > 0 && (
        <div className="flex items-center gap-2 pl-2">
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      )}
    </div>
  );
}

function ReasoningCard({ step }: { step: ReasoningStep }) {
  switch (step.type) {
    case "thinking":
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50">
          <svg className="w-3.5 h-3.5 text-muted-foreground animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
          <span className="text-xs text-muted-foreground">
            {step.data.message as string}
          </span>
        </div>
      );

    case "tool_call":
      return (
        <Card className="border-primary/20 shadow-sm overflow-hidden">
          <div className="bg-primary/5 px-3 py-2 flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.183A2.25 2.25 0 014.5 16.37V5.628a2.25 2.25 0 011.536-1.983l5.384-3.183a2.25 2.25 0 012.16 0l5.384 3.183A2.25 2.25 0 0119.5 5.628v10.742a2.25 2.25 0 01-1.536 1.983l-5.384 3.183a2.25 2.25 0 01-2.16 0z" />
            </svg>
            <Badge className="text-[10px] h-5">Tool Call</Badge>
            <code className="text-xs font-mono text-primary font-semibold">
              {step.data.tool as string}
            </code>
          </div>
          <CardContent className="p-3">
            <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded-md p-2 overflow-x-auto">
              {JSON.stringify(step.data.args, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );

    case "tool_result":
      return (
        <Card
          className={cn(
            "shadow-sm overflow-hidden",
            step.data.escalated ? "border-destructive/30" : "border-border/50"
          )}
        >
          <div
            className={cn(
              "px-3 py-2 flex items-center gap-2",
              step.data.escalated ? "bg-destructive/5" : "bg-muted/30"
            )}
          >
            <Badge
              variant={step.data.escalated ? "destructive" : "secondary"}
              className="text-[10px] h-5"
            >
              Result
            </Badge>
            <code className="text-[11px] font-mono text-muted-foreground">
              {step.data.tool as string}
            </code>
          </div>
          <CardContent className="p-3">
            <pre className="text-[11px] text-muted-foreground bg-muted/50 rounded-md p-2 overflow-x-auto max-h-28">
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(step.data.result as string),
                    null,
                    2
                  );
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
        <Card className="border-destructive bg-destructive/5 shadow-md">
          <CardContent className="py-3 px-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-destructive">GP Escalation</p>
              <p className="text-xs text-destructive/80">
                {step.data.reason as string}
              </p>
              <p className="text-[10px] text-destructive/60 mt-0.5">
                Urgency: {(step.data.urgency as string)?.toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>
      );

    case "agent_reply":
      return (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2 mb-1.5">
              <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              <Badge className="text-[10px] h-5">Reply</Badge>
            </div>
            <p className="text-sm leading-relaxed">
              {step.data.message as string}
            </p>
          </CardContent>
        </Card>
      );

    case "error":
      return (
        <Card className="border-destructive">
          <CardContent className="py-3 px-4">
            <Badge variant="destructive" className="text-[10px] h-5 mb-1">
              Error
            </Badge>
            <p className="text-sm text-destructive">
              {step.data.message as string}
            </p>
          </CardContent>
        </Card>
      );

    default:
      return null;
  }
}
