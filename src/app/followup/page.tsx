"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { NavHeader } from "@/components/nav-header";
import { ChatMessage } from "@/components/chat-message";
import {
  AgentReasoning,
  type ReasoningStep,
} from "@/components/agent-reasoning";
import { DEMO_PATIENT } from "@/data/demo-patient";

interface Message {
  role: "patient" | "agent";
  content: string;
}

const PRESET_MESSAGES = [
  {
    label: "Mi sento meglio, posso smettere?",
    description: "I feel better, can I stop?",
    icon: (
      <svg className="w-4 h-4 shrink-0 text-score-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>
    ),
  },
  {
    label: "Ho delle macchie rosse sulla pelle",
    description: "I have red spots on my skin — triggers GP ALERT",
    icon: (
      <svg className="w-4 h-4 shrink-0 text-score-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
      </svg>
    ),
  },
  {
    label: "Ho dimenticato una dose, che faccio?",
    description: "I forgot a dose, what do I do?",
    icon: (
      <svg className="w-4 h-4 shrink-0 text-score-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

export default function FollowupPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [gpAlert, setGpAlert] = useState<{
    reason: string;
    urgency: string;
  } | null>(null);
  const [seeded, setSeeded] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 自动 seed 演示处方数据
  useEffect(() => {
    fetch("/api/seed", { method: "POST" })
      .then(() => setSeeded(true))
      .catch(() => setSeeded(true)); // 即使失败也继续
  }, []);

  // 自动滚动到聊天底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || !seeded) return;

      setMessages((prev) => [...prev, { role: "patient", content: text }]);
      setReasoningSteps([]);
      setIsStreaming(true);
      setGpAlert(null);

      try {
        const response = await fetch("/api/adherence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: DEMO_PATIENT.id,
            message: text,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Failed to connect to adherence agent");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            try {
              const event = JSON.parse(jsonStr) as ReasoningStep;
              if (event.type === "done") continue;

              setReasoningSteps((prev) => [...prev, event]);

              if (event.type === "agent_reply") {
                setMessages((prev) => [
                  ...prev,
                  { role: "agent", content: event.data.message as string },
                ]);
              }

              if (event.type === "escalation") {
                setGpAlert({
                  reason: event.data.reason as string,
                  urgency: event.data.urgency as string,
                });
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      } catch (err) {
        setReasoningSteps((prev) => [
          ...prev,
          {
            type: "error",
            data: {
              message: err instanceof Error ? err.message : "Error",
            },
          },
        ]);
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, seeded]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavHeader currentPage="followup" />

      {/* GP ALERT 横幅 */}
      {gpAlert && (
        <div className="bg-destructive text-destructive-foreground py-3 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg tracking-wide">GP ALERT</div>
              <div className="text-sm opacity-90">
                {gpAlert.reason} — Urgency:{" "}
                <span className="font-bold">
                  {gpAlert.urgency.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-0">
        {/* 左侧：患者聊天（3/5） */}
        <Card className="lg:col-span-3 flex flex-col overflow-hidden shadow-sm">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-bold text-muted-foreground">
                  MR
                </span>
              </div>
              <div>
                <CardTitle className="text-base">
                  {DEMO_PATIENT.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Amoxicillin 1g BID — Day 3 of 10
                </p>
              </div>
            </div>
          </CardHeader>
          <Separator />

          {/* 聊天区域 */}
          <CardContent className="flex-1 overflow-y-auto space-y-3 py-4 min-h-0">
            {messages.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <svg className="w-7 h-7 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click a demo message below to simulate a patient question.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            <div ref={chatEndRef} />
          </CardContent>

          {/* 预设消息 */}
          <Separator />
          <div className="p-3 space-y-1.5 shrink-0 bg-muted/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium px-1">
              Demo Messages
            </p>
            {PRESET_MESSAGES.map((preset, i) => (
              <Button
                key={i}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-left h-auto py-2 px-3 hover:bg-card"
                onClick={() => sendMessage(preset.label)}
                disabled={isStreaming}
              >
                <div className="flex items-center gap-3 w-full">
                  {preset.icon}
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {preset.label}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {preset.description}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </Card>

        {/* 右侧：Agent 推理面板（2/5） */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden shadow-sm">
          <CardHeader className="pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-base">Agent Reasoning</CardTitle>
                <p className="text-[11px] text-muted-foreground">
                  Real-time tool calls & thinking
                </p>
              </div>
              {isStreaming && (
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-score-green animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Live
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 overflow-y-auto py-3 min-h-0">
            <AgentReasoning steps={reasoningSteps} isStreaming={isStreaming} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
