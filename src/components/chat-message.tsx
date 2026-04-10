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
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          role === "patient"
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border rounded-bl-md"
        )}
      >
        <div className="text-xs font-medium mb-1 opacity-70">
          {role === "patient" ? "Marta" : "Persana Agent"}
        </div>
        {content}
      </div>
    </div>
  );
}
