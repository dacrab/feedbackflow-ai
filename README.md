# FeedbackFlow AI

A calmer way to read your GitHub issues.

**Live demo:** https://feedbackflow-ai.vercel.app

Point FeedbackFlow at a repo and it gathers the open issues into one inbox. Add an LLM key and each item gets sentiment, severity, topic tags, and a one-line summary, so you can triage without opening every thread.

## What ends up in the inbox

- Up to the latest 1,000 open issues per connected repo
- A short AI summary with sentiment, severity, and topics
- Filters for sentiment, topic, severity, and triage status
- Charts for sentiment over time and the topics that keep coming up
- Triage states: New, Acknowledged, and Actioned
- Slack pings when feedback passes your severity threshold

## Running it

The app needs Bun, Doppler, a Neon Postgres database, and a Clerk application.

```bash
bun install
doppler setup
bun db:migrate
bun dev
```

It runs at [localhost:3000](http://localhost:3000). In Doppler or `.env.local`, set `DATABASE_URL`, the Clerk keys, and an `ENCRYPTION_KEY` from `openssl rand -hex 32`.

## Handy to know

- Only GitHub issues are imported; pull requests are filtered out.
- LLM keys, GitHub tokens, and Slack webhooks are encrypted before storage.
- A daily sync keeps things fresh, and "Sync now" runs one immediately.
- Slack is the only notification channel right now.

Under the hood: Next.js, Neon Postgres, Drizzle, Clerk, and the Vercel AI SDK. MIT licensed.
