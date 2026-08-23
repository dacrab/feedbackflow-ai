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

## How ingestion works

- **Sync** — a daily cron (07:00 UTC) ingests every enabled source, and "Sync now" in Settings streams live progress over SSE from `POST /api/sync`.
- **Add-a-repo** — adding a source kicks off a scoped background ingest for just that repo (first 20 issues analyzed); the next cron covers the rest.
- **Self-healing runs** — each ingest takes an exclusive per-user lock. Runs abandoned by a crashed invocation are automatically reclaimed after 10 minutes, so a dead sync can never wedge your inbox.
- **Issues only** — GitHub pull requests returned by the issues endpoint are filtered out before anything is stored.
- **Deduplicated** — items are keyed by repo + issue id; re-syncs never duplicate.

## Security notes

- **Strict CSP** — a per-request nonce CSP (`script-src 'nonce-…' 'strict-dynamic'`) is generated in `src/proxy.ts` and stamped onto every script tag, including Clerk's loader and the theme bootstrap.
- **Rate limits** — sync/cron endpoints are IP-limited using the platform-set `x-real-ip` (falling back to the last `x-forwarded-for` entry), so spoofed headers can't rotate limits.
- **Webhooks** — the Clerk webhook is authenticated solely by its svix signature and is intentionally not rate-limited.
- **Secrets at rest** — LLM keys, GitHub tokens, and Slack webhooks are AES-256-GCM encrypted with `ENCRYPTION_KEY`.

If you sign in before your account record has synced, you'll see an "account is being provisioned" error — refresh a moment later.

## Built with

Bun · Next.js · Neon Postgres · Drizzle · Clerk · Vercel AI SDK · Tailwind CSS
