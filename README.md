# FeedbackFlow AI

Turn GitHub issues into an actionable feedback inbox. Connect a repo, and AI automatically tags each issue with sentiment, severity, and topics — so you can focus on what actually matters.

## What it does

- **Inbox** — all your GitHub issues in one place, filtered by sentiment, topic, severity, or triage status
- **AI analysis** — each issue gets a sentiment score, severity rating (1–5), topic tags, and a one-line summary
- **Dashboard** — sentiment trends, topic breakdown, and severity distribution over time
- **Slack alerts** — get notified when high-severity feedback lands
- **Triage** — mark issues as New → Acknowledged → Actioned, individually or in bulk

## Getting started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 18+)
- [Neon](https://neon.tech) Postgres database (free tier works)
- An LLM API key — [OpenRouter](https://openrouter.ai/keys) has a free tier, no credit card needed

### 1. Clone and install

```bash
git clone https://github.com/dacrab/feedbackflow-ai
cd feedbackflow-ai
bun install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the required values:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon Postgres connection string |
| `BETTER_AUTH_URL` | ✅ | Your app's base URL (e.g. `http://localhost:3000`) |
| `BETTER_AUTH_SECRET` | ✅ | Random secret — run `openssl rand -base64 32` |
| `ENCRYPTION_KEY` | ✅ | Used to encrypt stored API keys — run `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | — | Recommended free LLM option |
| `OPENAI_API_KEY` | — | OpenAI alternative |

| `GOOGLE_GENERATIVE_AI_API_KEY` | — | Google Gemini alternative |
| `GITHUB_CLIENT_ID/SECRET` | — | For GitHub OAuth login (optional) |
| `GOOGLE_CLIENT_ID/SECRET` | — | For Google OAuth login (optional) |
| `CRON_SECRET` | — | Secures the cron endpoint on Vercel |
| `SLACK_WEBHOOK_URL` | — | For Slack alert notifications |

### 3. Set up the database

```bash
bun db:migrate    # apply schema to your Neon database
bun db:seed       # optional: add sample data
```

### 4. Run locally

```bash
bun dev
# open http://localhost:3000
```

## Deploying to Vercel

1. Push to GitHub and import the repo in [Vercel](https://vercel.com).
2. Add all required environment variables in the project settings.
3. Add a Cron Job pointing to `/api/cron` (daily schedule recommended).

## Tech stack

Next.js 16 · Neon Postgres · Drizzle ORM · better-auth · Vercel AI SDK · Tailwind CSS v4 · Recharts

## Contributing

PRs and issues welcome. Please include a description and screenshots where relevant.
