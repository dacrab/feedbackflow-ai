# FeedbackFlow AI

Automated micro‑SaaS to ingest public feedback, analyze it with LLMs, and triage it in a secure, modern Next.js + Supabase app.

## What it does

FeedbackFlow AI consolidates public feedback (e.g., reviews or GitHub issues), runs multi‑task LLM analysis, and gives product and CS teams an actionable inbox with filters, severity, and summaries.

## Key features

- **Auth**: Secure signup/signin. Protected UI routes and APIs (via Supabase Auth + RLS).
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
  ↕  Supabase Auth (client)
[API Layer: Next.js API routes or Supabase Edge Functions]
  ├─ Auth Controller → Users
  ├─ Feedback Controller → FeedbackItem + FeedbackAnalysis
  ├─ Dashboard Controller → Aggregates
  └─ Webhook Controller (optional)
      ↕
[Database: Supabase Postgres]
      ↑
[Cron: Supabase Scheduled Edge Function or pg_cron]
  1) Fetch new feedback  2) Deduplicate  3) Call LLM  4) Persist
```

## Tech stack

- **Frontend**: Next.js (TypeScript, App Router). Tailwind CSS recommended.
- **Backend**: Supabase (Postgres, Auth, RLS, Edge Functions, pg_cron optional)
- **LLM provider**: OpenAI or Anthropic
- **Charts**: you can use `recharts`, `chart.js`, or similar

## Data model (concise)

- `app_users`: id (uuid), email (citext, unique), created_at
- `feedback_items`: id, user_id, source, external_id, raw_content, original_timestamp, created_at
- `feedback_analyses`: id, user_id, feedback_item_id, sentiment, topics (jsonb), severity_score (1..5), summary, status, created_at
- `analysis_topics`: id, feedback_analysis_id, user_id, topic (text)

### Example SQL (tables, enums, RLS)

```sql
-- Enable helpful extensions
create extension if not exists pgcrypto;
create extension if not exists citext;

-- Enums
do $$ begin
  if not exists (select 1 from pg_type where typname = 'sentiment') then
    create type sentiment as enum ('positive','neutral','negative');
  end if;
  if not exists (select 1 from pg_type where typname = 'triage_status') then
    create type triage_status as enum ('New','Acknowledged','Actioned');
  end if;
end $$;

-- Users
create table if not exists app_users (
  id uuid primary key,
  email citext unique not null,
  created_at timestamptz not null default now()
);
alter table app_users enable row level security;
create policy app_users_self on app_users
  for select using (id = auth.uid());
create policy app_users_insert_self on app_users
  for insert with check (id = auth.uid());

-- Feedback items
create table if not exists feedback_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  source text not null,
  external_id text not null,
  raw_content text not null,
  original_timestamp timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
alter table feedback_items enable row level security;
create policy feedback_items_owner on feedback_items
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Analyses
create table if not exists feedback_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  feedback_item_id uuid not null references feedback_items(id) on delete cascade,
  sentiment sentiment not null,
  topics jsonb not null default '[]'::jsonb,
  severity_score int not null check (severity_score between 1 and 5),
  summary text not null,
  status triage_status not null default 'New',
  created_at timestamptz not null default now()
);
create index if not exists idx_feedback_analyses_user_created on feedback_analyses(user_id, created_at desc);
create index if not exists idx_feedback_analyses_severity on feedback_analyses(severity_score);
create index if not exists idx_feedback_analyses_topics_gin on feedback_analyses using gin (topics jsonb_path_ops);
alter table feedback_analyses enable row level security;
create policy feedback_analyses_owner on feedback_analyses
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Normalized topics (optional but useful for filtering)
create table if not exists analysis_topics (
  id uuid primary key default gen_random_uuid(),
  feedback_analysis_id uuid not null references feedback_analyses(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  topic text not null
);
create index if not exists idx_analysis_topics_user_topic on analysis_topics(user_id, topic);
alter table analysis_topics enable row level security;
create policy analysis_topics_owner on analysis_topics
  using (user_id = auth.uid()) with check (user_id = auth.uid());
```

## Getting started (local)

### Prerequisites

- Node.js 18+ and a package manager (`npm`, `pnpm`, or `yarn`)
- Supabase project (create one at `https://supabase.com`)
- LLM provider key (OpenAI or Anthropic)
- If using GitHub Issues as the ingest source: a GitHub token (optional but increases rate limits)

### 1) Clone and install

```bash
git clone https://github.com/your-org/feedbackflow-ai
cd feedbackflow-ai
npm install
```

### 2) Environment variables

Create `.env.local` for the Next.js app:

```env
NEXT_PUBLIC_SUPABASE_URL="https://<project>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon-key>"

# LLM
OPENAI_API_KEY="<key>"        # or ANTHROPIC_API_KEY
LLM_PROVIDER="openai"         # or "anthropic"

# Ingest: choose one source; GitHub recommended for first run
GITHUB_REPO_OWNER="<owner>"
GITHUB_REPO_NAME="<repo>"
GITHUB_TOKEN="<optional-token>"

# Optional Slack (stretch)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

If you deploy an Edge Function for ingest, set its secrets in Supabase (Project → Settings → Functions → Secrets):

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- the same LLM and source variables you used above

### 3) Initialize the database

Run the SQL in “Example SQL” above in the Supabase SQL Editor (or via the CLI) to create tables, enums, indexes, and RLS policies.

### 4) Start the app

```bash
npm run dev
# open http://localhost:3000
```

## Ingestion (cron)

You have two options for the daily ingest job:

- **Scheduled Edge Function (recommended)**: Create an Edge Function (e.g., `ingest`) that fetches new items, deduplicates by `(user_id, source, external_id)`, calls the LLM, and writes to `feedback_analyses`. Schedule it daily from the Supabase dashboard.
- **pg_cron**: Alternatively, use `pg_cron` to call an internal endpoint or stored procedure on a schedule.

Tips:

- Use idempotency on `(user_id, source, external_id)` to avoid duplicates.
- Log fetch/LLM errors and retry transient failures.
- For Slack alerts (stretch), POST to the webhook when `severity_score >= 4`.

## Deployment

### Frontend (Vercel)

1. Push the repository to GitHub.
2. Import into Vercel and set environment variables from `.env.local`.
3. Assign a custom domain (e.g., `feedbackflow.dev`).

### Backend jobs (Supabase)

1. Create and deploy the Edge Function used for ingest.
2. Configure function secrets and schedule it to run daily.
3. Verify logs show successful runs and new data appears in the UI.

## Security

- Never expose service role keys in the browser.
- All tables are protected by RLS with owner‑only access using `auth.uid()`.
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

