# FeedbackFlow AI

Automated micro‑SaaS to ingest public feedback, analyze it with LLMs, and triage it in a secure, modern Next.js + Neon Postgres + Auth.js app.

## What it does

FeedbackFlow AI consolidates public feedback (e.g., reviews or GitHub issues), runs multi‑task LLM analysis, and gives product and CS teams an actionable inbox with filters, severity, and summaries.

## Key features

- **Auth**: Secure signup/signin. Protected UI routes and APIs (via Auth.js / NextAuth + per‑user row scoping in Neon Postgres).
- **LLM analysis**: For each feedback item, produces:
  - **Sentiment**: positive | neutral | negative
  - **Topics**: an array of strings (e.g., Bug Report, Feature Request, Pricing, Performance)
  - **Severity score**: integer 1‑5
  - **Summary**: concise one‑liner
- **Daily ingest (cron)**:
  - Fetches new items from a real public source (pick one; GitHub Issues recommended to start)
  - Persists raw content, deduplicates by `external_id`, calls LLM, stores structured results
  - Basic retry and error logging
- **UI**:
  - Dashboard: sentiment trends and topic distribution
  - Inbox: filter/sort by sentiment, topic, severity
  - Detail view: raw content + structured AI analysis
- **Stretch (optional)**:
  - Slack webhooks for severity ≥ 4
  - Triage statuses (New, Acknowledged, Actioned) and digest emails
  - Strong idempotency on ingest

## Architecture

```text
[Frontend: Next.js (App Router)]
  ↕  Auth.js / NextAuth (credentials + OAuth)
[API Layer: Next.js API routes]
  ├─ Auth Controller → Users
  ├─ Feedback Controller → FeedbackItem + FeedbackAnalysis
  ├─ Dashboard Controller → Aggregates
  └─ Webhook Controller (optional)
      ↕
[Database: Neon Postgres (via Drizzle ORM)]
      ↑
[Cron: Vercel Cron → Next.js API]
  1) Fetch new feedback  2) Deduplicate  3) Call LLM  4) Persist
```

## Tech stack

- **Frontend**: Next.js (TypeScript, App Router). Tailwind CSS recommended.
- **Backend**: Neon Postgres + Drizzle ORM + Auth.js (NextAuth) + Vercel Cron
- **LLM provider**: OpenAI or Anthropic
- **Charts**: you can use `recharts`, `chart.js`, or similar

## Data model (concise)

- `app_users`: id (uuid), email (unique), password_hash, created_at
- `feedback_items`: id, user_id, source, external_id, raw_content, original_timestamp, created_at
- `feedback_analyses`: id, user_id, feedback_item_id, sentiment, topics (jsonb), severity_score (1..5), summary, status, created_at
- `analysis_topics`: id, feedback_analysis_id, user_id, topic (text)

### Schema & migrations

The schema is defined via Drizzle in `src/db/schema.ts` and managed with migrations in the `drizzle` directory.

## Getting started (local)

### Prerequisites

- Node.js 18+ and a package manager (`npm`, `pnpm`, `yarn`, or `bun`)
- Neon Postgres project (create one in the Neon console)
- LLM provider key (OpenAI or Anthropic)
- If using GitHub Issues as the ingest source: a GitHub token (optional but increases rate limits)

### 1) Clone and install

```bash
git clone https://github.com/your-org/feedbackflow-ai
cd feedbackflow-ai
npm install
```

### 2) Environment variables

Copy `.env.example` to `.env` (and/or `.env.local`) and fill in:

- `DATABASE_URL` – Neon Postgres connection string
- `NEXTAUTH_URL` / `NEXTAUTH_SECRET` – Auth.js config
- `LLM_PROVIDER` + relevant API key (`OPENAI_API_KEY` / `ANTHROPIC_API_KEY`)
- `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` / `GITHUB_TOKEN` – ingest source
- `CRON_TOKEN` – shared secret for cron calls
- `SLACK_WEBHOOK_URL` – optional Slack notifications

### 3) Initialize the database

Generate and apply Drizzle migrations to Neon:

```bash
bun db:generate
bun db:migrate
```

Optionally seed a sample feedback item:

```bash
bun db:seed
```

### 4) Start the app

```bash
bun dev
# open http://localhost:3000
```

## Ingestion (cron)

Use **Vercel Cron Jobs** (or any external scheduler) to call the Next.js API:

- `POST /api/ingest` with header `x-cron-token: $CRON_TOKEN` (daily GitHub ingest + LLM analysis)
- `GET /api/digest` with header `x-cron-token: $CRON_TOKEN` (daily severity digest + Slack notifications)

Tips:

- Use idempotency on `(user_id, source, external_id)` to avoid duplicates.
- Log fetch/LLM errors and retry transient failures.
- For Slack alerts, the code will POST when `severity_score >= 4` and per‑user webhooks are configured.

## Deployment

### Frontend (Vercel)

1. Push the repository to GitHub.
2. Import into Vercel and set environment variables from `.env`.
3. Assign a custom domain (e.g., `feedbackflow.dev`).

### Backend jobs (Vercel Cron + Neon)

1. Configure Vercel Cron to call `/api/ingest` and `/api/digest` on your custom domain.
2. Point `DATABASE_URL` to your Neon database in Vercel environment settings.
3. Verify logs show successful runs and new data appears in the UI.

## Security

- Never expose database credentials or API keys in the browser.
- All tables are scoped by `user_id`, and queries enforce per‑user filtering; Neon RLS policies can additionally enforce `user_id` at the database layer.
- Load secrets from environment variables only.

## Acceptance checklist

- **Auth**: signup/login work; protected routes redirect logged‑out users.
- **Cron & Ingest**: daily job fetches real data and persists raw content.
- **LLM**: each new item has a `feedback_analyses` record with structured JSON fields.
- **Reliability**: retries/logging on fetch & LLM errors; deduplication by external id.
- **UI**: inbox filtering/sorting by severity/topic; dashboard charts render correctly.
- **Security**: secrets in env; RLS policies enforced.

## Contributing

Issues and PRs are welcome. Please include clear descriptions and, when relevant, screenshots or short clips.

