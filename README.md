# FeedbackFlow AI

Turn GitHub issues into a feedback inbox that reads itself. Connect a repo and every issue gets tagged with sentiment, severity, and topics — so you can focus on what matters.

## What you can do

- **One inbox** — every GitHub issue in one place, filtered by sentiment, topic, severity, or status
- **AI tagging** — each issue gets a sentiment score, severity rating, topics, and a one-line summary
- **Trend dashboard** — see sentiment over time, hot topics, and severity at a glance
- **Slack alerts** — get pinged when high-severity feedback lands
- **Simple triage** — New → Acknowledged → Actioned

## Try it locally

You'll need [Bun](https://bun.sh) and a [Neon](https://neon.tech) Postgres database (free tier is fine).

```bash
git clone https://github.com/dacrab/feedbackflow-ai
cd feedbackflow-ai
bun install
```

Copy `.env.example` to `.env` and fill in the values (or set up Doppler). You'll need:

- Your Postgres connection string
- Clerk keys (free at clerk.com — create an app to get them)
- An `ENCRYPTION_KEY` (generate with `openssl rand -hex 32`)

Everything else is optional. LLM keys and Slack webhooks are set up later, right in the app.

```bash
bun db:migrate
bun dev
```

Open http://localhost:3000.

## Deploy

Host it on [Vercel](https://vercel.com):

1. Import the repo
2. Add the same environment variables
3. Cron jobs are already configured — nothing else to do

## Built with

Bun · Next.js · Neon Postgres · Drizzle · Clerk · Vercel AI SDK · Tailwind CSS
