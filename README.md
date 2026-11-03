# FeedbackFlow AI

An inbox for GitHub issues that tags each one with sentiment, severity, and topics.

**Live demo:** https://feedbackflow-ai.vercel.app

Connect a GitHub repo and FeedbackFlow pulls its open issues into one place. Add an LLM key in Settings and each issue gets a short summary, sentiment score, severity rating, and topic tags — so you can see what needs attention without reading everything.

## Features

- One inbox for the latest 1,000 open issues per connected repo
- AI summaries with sentiment, severity, and topic tags
- Filter by sentiment, topic, severity, or triage status
- A dashboard for sentiment over time, hot topics, and severity
- Simple triage: New → Acknowledged → Actioned
- Slack alerts when feedback crosses your severity threshold

## Run it locally

You'll need [Bun](https://bun.sh), [Doppler](https://doppler.com) for secrets, a [Neon](https://neon.tech) Postgres database, and a [Clerk](https://clerk.com) app.

```bash
bun install
doppler setup
bun db:migrate
bun dev
```

Open [localhost:3000](http://localhost:3000).

If you don't use Doppler, remove the `doppler run --` prefix from the scripts in `package.json` and copy `.env.example` to `.env.local`.

## Good to know

- Feedback comes from public GitHub issues; pull requests are ignored.
- LLM keys, GitHub tokens, and Slack webhooks are encrypted before they are stored.
- Issues sync on a daily schedule, and "Sync now" runs an immediate sync.
- Slack is currently the only notification channel.

## Built with

Next.js, Neon Postgres, Drizzle, Clerk, and the Vercel AI SDK. Hosted on Vercel.

## License

MIT
