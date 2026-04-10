@AGENTS.md

# Persana Health

AI-assisted antibiotic prescription support system for Italian GPs (demo).
Scope: acute pharyngitis only, using Centor/McIsaac score.

## Tech Stack

- **Framework**: Next.js 15 App Router + @opennextjs/cloudflare adapter
- **Language**: TypeScript (strict mode)
- **UI**: Tailwind CSS + shadcn/ui
- **LLM**: Gemini 3 Flash via `@google/genai` SDK (model id: `gemini-3-flash`)
- **Storage**: Cloudflare KV (`PERSANA_KV` binding) — simulated EHR
- **Deploy**: Cloudflare Workers + Pages

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页 → 重定向到 /patient
│   ├── patient/page.tsx        # 患者 intake 表单
│   ├── doctor/page.tsx         # GP 仪表盘（评分 + 指南选项）
│   ├── followup/page.tsx       # 随访聊天 + Agent 推理面板
│   └── api/
│       ├── intake/route.ts     # Intake Agent（结构化输出）
│       ├── reason/route.ts     # 临床推理（确定性评分 + LLM）
│       ├── prescribe/route.ts  # 保存处方到 KV
│       └── adherence/route.ts  # Adherence Agent（函数调用 + 流式）
├── lib/
│   ├── gemini.ts               # Gemini 客户端初始化
│   ├── kv.ts                   # KV 存储工具函数
│   ├── centor.ts               # McIsaac 评分计算（纯确定性）
│   └── schemas.ts              # Zod schemas
├── data/
│   ├── antibiotics.ts          # 3 种抗生素选项
│   ├── guidelines.ts           # 用药指南
│   └── demo-patient.ts         # Marta Rossi 预填数据
└── components/
    ├── ui/                     # shadcn/ui 组件
    ├── centor-gauge.tsx        # 评分仪表盘
    ├── probability-bar.tsx     # 概率条
    ├── antibiotic-card.tsx     # 抗生素卡片
    ├── agent-reasoning.tsx     # Agent 推理面板
    └── chat-message.tsx        # 聊天消息
```

## Commands

```bash
npm run dev        # 本地开发
npm run build      # Next.js 构建
npm run preview    # Cloudflare 本地预览
npm run deploy     # 部署到 Cloudflare
```

## Environment Variables

- `GEMINI_API_KEY` — Google Gemini API key (production: `wrangler secret put GEMINI_API_KEY`)

## Critical Constraints

1. **LLM 措辞规则**: LLM 绝不能说 "I recommend X"。必须使用 "guideline-matched options for this presentation include..."。系统展示选项，医生做决定。
2. **免责声明**: /doctor 页面顶部必须显示 "AI-surfaced options — clinical decision remains with the physician"。
3. **Centor 评分**: Step A 是纯确定性计算（不用 LLM），Step B 才用 LLM 生成摘要。
4. **皮疹升级**: 患者报告皮疹时，Adherence Agent 必须调用 `escalate_to_gp`。
5. **无真实数据**: 无真实身份验证、无真实数据库、无真实短信。一切模拟。

## Coding Conventions

- 使用 App Router（不使用 Pages Router）
- 所有 API 路由使用 Route Handlers (`route.ts`)
- 组件默认 Server Component，需要交互时添加 `"use client"`
- 使用 Zod 验证所有 API 输入输出
- 品牌色：主色 #4A5B7A（slate blue），背景 #F5F1E8（warm off-white），告警 red
