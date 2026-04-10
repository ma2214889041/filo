"use client";

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ChatMessage } from "@/components/chat-message";
import { AgentReasoning, type ReasoningStep } from "@/components/agent-reasoning";
import { DEMO_PATIENT } from "@/data/demo-patient";

interface Message {
  role: "patient" | "agent";
  content: string;
}

const PRESET_MESSAGES = [
  {
    label: "Mi sento meglio, posso smettere?",
    description: "I feel better, can I stop?",
  },
  {
    label: "Ho delle macchie rosse sulla pelle",
    description: "I have red spots on my skin",
  },
  {
    label: "Ho dimenticato una dose, che faccio?",
    description: "I forgot a dose, what do I do?",
  },
];

export default function FollowupPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [gpAlert, setGpAlert] = useState<{ reason: string; urgency: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming) return;

    // 添加患者消息
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
            // 忽略解析错误
          }
        }
      }
    } catch (err) {
      setReasoningSteps((prev) => [
        ...prev,
        { type: "error", data: { message: err instanceof Error ? err.message : "Error" } },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming]);

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部标题 */}
      <div className="bg-primary text-primary-foreground py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Persana Health — Follow-up</h1>
            <p className="text-xs opacity-80">
              Patient adherence monitoring &amp; AI agent support
            </p>
          </div>
          <Button
            variant="ghost"
            className="text-primary-foreground hover:text-primary-foreground/80"
            onClick={() => (window.location.href = "/doctor")}
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      {/* GP ALERT 横幅 */}
      {gpAlert && (
        <div className="bg-destructive text-destructive-foreground py-3 px-4 animate-pulse">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <span className="text-2xl">⚠</span>
            <div>
              <div className="font-bold text-lg">GP ALERT</div>
              <div className="text-sm">
                {gpAlert.reason} — Urgency: {gpAlert.urgency.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区：分屏 */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-64px)]">
        {/* 左侧：患者聊天 */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-lg">Patient Chat — {DEMO_PATIENT.name}</CardTitle>
          </CardHeader>
          <Separator />

          {/* 聊天消息区域 */}
          <CardContent className="flex-1 overflow-y-auto space-y-3 py-4">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Select a demo message below to start the conversation.
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            <div ref={chatEndRef} />
          </CardContent>

          {/* 预设消息按钮 */}
          <Separator />
          <div className="p-4 space-y-2 shrink-0">
            <p className="text-xs text-muted-foreground mb-2">Demo messages (click to send):</p>
            {PRESET_MESSAGES.map((preset, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="w-full justify-start text-left h-auto py-2"
                onClick={() => sendMessage(preset.label)}
                disabled={isStreaming}
              >
                <div>
                  <div className="font-medium text-sm">{preset.label}</div>
                  <div className="text-xs text-muted-foreground">{preset.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </Card>

        {/* 右侧：Agent 推理面板 */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-lg">Agent Reasoning Panel</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 overflow-y-auto py-4">
            <AgentReasoning steps={reasoningSteps} isStreaming={isStreaming} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
