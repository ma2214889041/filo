"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "patient" | "agent";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "flex w-full",
        role === "patient" ? "justify-end" : "justify-start"
      )}
    >
      <div className="flex items-end gap-2 max-w-[85%]">
        {role === "agent" && (
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-1">
            <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
            </svg>
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
            role === "patient"
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md shadow-sm"
          )}
        >
          {content}
        </div>
        {role === "patient" && (
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mb-1">
            <span className="text-[10px] font-bold text-muted-foreground">MR</span>
          </div>
        )}
      </div>
    </div>
  );
}
