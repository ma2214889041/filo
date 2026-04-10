# Persana Health

AI-assisted antibiotic prescription support system for Italian GPs (demo).

**Scope:** Acute pharyngitis only, using Centor/McIsaac score.

## Demo Flow

1. **`/patient`** — Patient (Marta Rossi) fills in symptoms
2. **`/doctor`** — GP sees Centor score, clinical summary, and guideline-matched antibiotic options
3. **`/followup`** — Post-prescription: patient sends messages, AI agent responds with real-time reasoning visible

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| LLM | Gemini 2.5 Flash (`@google/genai`) |
| Storage | Cloudflare KV (simulated EHR) |
| Deploy | Cloudflare Workers via `@opennextjs/cloudflare` |

## Three LLM Nodes

1. **Intake Agent** — Extracts 5 Centor criteria from free text (structured output, minimal thinking)
2. **Clinical Reasoning** — Deterministic McIsaac score + LLM clinical summary (medium thinking)
3. **Adherence Agent** — Function-calling loop with 4 tools, streams reasoning to UI (high thinking)

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set environment variable
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 3. Start dev server
npm run dev

# 4. Open browser
# http://localhost:3000/patient
```

## Cloudflare Deployment

```bash
# 1. Create KV namespace
npx wrangler kv namespace create PERSANA_KV
# Copy the ID into wrangler.jsonc

# 2. Set Gemini API key as secret
npx wrangler secret put GEMINI_API_KEY

# 3. Preview locally with Cloudflare runtime
npm run preview

# 4. Deploy to production
npm run deploy
```

## Key Design Decisions

- **LLM never recommends**: The system surfaces options; the GP decides. All LLM output uses "guideline-matched options include..." phrasing.
- **Deterministic scoring**: McIsaac score is computed in TypeScript, not by the LLM.
- **Rash = escalation**: The Adherence Agent always escalates skin reactions to the GP.
- **No real data**: Everything is simulated — no auth, no database, no SMS.

## Project Structure

```
src/
├── app/
│   ├── patient/page.tsx    — Patient intake form
│   ├── doctor/page.tsx     — GP dashboard
│   ├── followup/page.tsx   — Chat + agent reasoning
│   └── api/
│       ├── intake/         — Intake Agent
│       ├── reason/         — Clinical Reasoning
│       ├── prescribe/      — Save prescription
│       └── adherence/      — Adherence Agent (streaming)
├── lib/                    — Gemini client, KV, Centor calc, Zod schemas
├── data/                   — Hardcoded antibiotics, guidelines, demo patient
└── components/             — UI components
```
