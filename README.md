# FeedbackFlow AI

Turn GitHub issues into an actionable feedback inbox. Connect a repo, and AI automatically tags each issue with sentiment, severity, and topics.

## Features

- **Inbox** — all your GitHub issues in one place, filtered by sentiment, topic, severity, or triage status
- **AI analysis** — sentiment score, severity rating, topic tags, and one-line summary per issue
- **Dashboard** — sentiment trends, topic breakdown, and severity distribution over time
- **Slack alerts** — notified when high-severity feedback lands
- **Triage** — mark issues as New → Acknowledged → Actioned

## Getting started

### Prerequisites

- [Bun](https://bun.sh)
- [Neon](https://neon.tech) Postgres (free tier works)
- LLM API key — [OpenRouter](https://openrouter.ai/keys) (free, no credit card)

### Setup

```bash
git clone https://github.com/dacrab/feedbackflow-ai
cd feedbackflow-ai
bun install
```

Copy `.env.example` to `.env.local`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Yes | App base URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | No | Clerk webhook signing secret |
| `ENCRYPTION_KEY` | Yes | `openssl rand -base64 32` |
| `OPENROUTER_API_KEY` | No | Recommended free LLM |
| `OPENAI_API_KEY` | No | OpenAI alternative |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Gemini alternative |
| `SLACK_WEBHOOK_URL` | No | Slack notifications |

```bash
bun db:migrate
bun db:seed       # optional
bun dev           # http://localhost:3000
```

### Deploy to Vercel

1. Import repo in [Vercel](https://vercel.com)
2. Add all environment variables
3. Add a Cron Job pointing to `/api/cron`

## Tech

Bun · Neon Postgres · Drizzle ORM · Clerk · Vercel AI SDK · Tailwind CSS v4 · Recharts

## Contributing

PRs and issues welcome. Include screenshots where relevant.
