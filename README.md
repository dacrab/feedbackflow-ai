# FeedbackFlow AI

Micro-SaaS that ingests GitHub issues, runs LLM analysis, and gives you an actionable feedback inbox with sentiment, severity, and topic tagging.

## Features

- **Auth** — email/password + OAuth (GitHub, Google) via better-auth. All data is per-user scoped.
- **Ingest** — connects to GitHub repos, fetches issues on a schedule, deduplicates by `external_id`.
- **LLM analysis** — sentiment (positive/neutral/negative), severity (1–5), topics, and a one-line summary per item. Supports OpenRouter (free), Google Gemini, OpenAI, and Anthropic.
- **Inbox** — filter and sort by sentiment, topic, severity, or status. Bulk triage actions.
- **Dashboard** — sentiment trends, topic distribution, severity histogram.
- **Notifications** — Slack webhooks for feedback with severity ≥ threshold (configurable per webhook).
- **Triage statuses** — New → Acknowledged → Actioned.

## Tech stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Database**: Neon Postgres + Drizzle ORM
- **Auth**: better-auth
- **LLM**: Vercel AI SDK — OpenRouter / Google / OpenAI / Anthropic
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Cron**: Vercel Cron Jobs

## Architecture

```
Next.js App Router
  ├─ better-auth (credentials + OAuth)
  ├─ /api/ingest  → fetch GitHub issues → LLM analysis → Neon Postgres
  ├─ /api/sync    → SSE stream for live sync progress
  ├─ /api/digest  → daily Slack digest
  └─ /api/cron    → Vercel Cron entry point
```

## Getting started

### Prerequisites

- Node.js 18+ / Bun
- [Neon](https://neon.tech) Postgres project
- LLM key — get a free one at [openrouter.ai/keys](https://openrouter.ai/keys)

### 1. Clone and install

```bash
git clone https://github.com/dacrab/feedbackflow-ai
cd feedbackflow-ai
bun install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `BETTER_AUTH_URL` | ✅ | App base URL (e.g. `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | ✅ | Random secret (`openssl rand -base64 32`) |
| `ENCRYPTION_KEY` | ✅ | Key for encrypting stored API keys (`openssl rand -base64 32`) |
| `OPENROUTER_API_KEY` | — | Free LLM tier via [openrouter.ai](https://openrouter.ai/keys) |
| `OPENAI_API_KEY` | — | OpenAI fallback |
| `ANTHROPIC_API_KEY` | — | Anthropic fallback |
| `GOOGLE_GENERATIVE_AI_API_KEY` | — | Google Gemini fallback |
| `GITHUB_CLIENT_ID/SECRET` | — | OAuth (optional) |
| `GOOGLE_CLIENT_ID/SECRET` | — | OAuth (optional) |
| `CRON_SECRET` | — | Vercel Cron auth token |
| `SLACK_WEBHOOK_URL` | — | Global Slack webhook for alerts |

### 3. Database

```bash
bun db:generate   # generate migrations from schema
bun db:migrate    # apply to Neon
bun db:seed       # optional: seed sample data
```

### 4. Run

```bash
bun dev
# http://localhost:3000
```

## Cron endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/ingest` | POST | Fetch new GitHub issues + run LLM analysis |
| `/api/digest` | GET | Send daily Slack digest for high-severity items |
| `/api/cron` | GET | Vercel Cron entry point (calls ingest + digest) |

All require `x-cron-token: $CRON_TOKEN` or Vercel's `CRON_SECRET` header.

## Deployment (Vercel)

1. Push to GitHub and import into Vercel.
2. Set all required env vars in Vercel project settings.
3. Add Cron Jobs in `vercel.json` or the Vercel dashboard pointing to `/api/cron`.

## Data model

| Table | Purpose |
|---|---|
| `user` | better-auth users |
| `feedback_items` | raw ingested content, deduplicated by `(user_id, source, external_id)` |
| `feedback_analyses` | LLM output: sentiment, topics, severity, summary, status |
| `user_sources` | per-user GitHub repo connections |
| `user_settings` | per-user LLM provider/model/key |
| `user_notifications` | per-user Slack webhooks |
| `ingest_runs` | audit log of ingest jobs |

## Security

- All DB queries are scoped by `user_id`.
- API keys stored encrypted (AES-256-GCM) via `ENCRYPTION_KEY`.
- Security headers (CSP, HSTS, X-Frame-Options) applied globally.
- Secrets loaded from env only — never exposed to the browser.

## Contributing

PRs and issues welcome. Include a description and screenshots where relevant.
