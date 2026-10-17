# FeedbackFlow AI

Turn GitHub issues into a feedback inbox that reads itself. Connect a repo and every issue gets tagged with sentiment, severity, and topics — so you can focus on what matters.

## What you can do

- **One inbox** — every open GitHub issue in one place (most recent 1,000 per repo), filtered by sentiment, topic, severity, or status
- **AI tagging** — once you've added an LLM key in Settings, each issue gets a sentiment score, severity rating, topics, and a one-line summary
- **Trend dashboard** — sentiment over time, hot topics, and severity at a glance
- **Slack alerts** — pinged when feedback at or above your severity threshold lands
- **Simple triage** — New → Acknowledged → Actioned

## Try it locally

You'll need [Bun](https://bun.sh), [Doppler](https://doppler.com) for secrets, and a [Neon](https://neon.tech) Postgres database (free tier is fine).

```bash
git clone https://github.com/dacrab/feedbackflow-ai
cd feedbackflow-ai
bun install
doppler setup
```

`doppler setup` picks the project up from the committed `doppler.yaml` — no flags needed. The dev server and the `db:*` scripts all shell out to `doppler run --`, so Doppler is required (not optional). If you would rather manage env vars yourself, strip the `doppler run --` prefix from `package.json` and copy `.env.example` to `.env.local` instead.

You'll need a Postgres connection string, Clerk keys (create a free app at clerk.com), and an `ENCRYPTION_KEY` (`openssl rand -hex 32`). Everything else is optional — LLM keys and Slack webhooks are set up later, right in the app.

```bash
bun db:migrate
bun dev
```

Open http://localhost:3000.

## Deploy

Host it on [Vercel](https://vercel.com):

1. Import the repo
2. Add the same environment variables — and set **`CRON_SECRET`**, or the daily job returns 401 and never runs
3. Run `bun db:migrate` against the production database once
4. Deploy

The cron schedule is already configured in `vercel.json`.

## How ingestion works

- **Sync** — a daily cron (07:00 UTC) ingests every enabled source, and "Sync now" in Settings streams live progress over SSE from `POST /api/sync`.
- **Add-a-repo** — adding a source kicks off a scoped background ingest for just that repo (first 20 issues analyzed); the next cron covers the rest.
- **Self-healing runs** — each ingest takes an exclusive per-user lock via a partial unique index, so a race can never produce two runs. Runs abandoned by a crashed invocation are reclaimed after 10 minutes.
- **Per-tenant isolation** — one user's sync failing (revoked token, deleted repo) never stops anyone else's, and `/api/cron` reports failure if any tenant failed.
- **Times are filing times** — dashboards bucket on `original_timestamp` (when the issue was opened), not on when we scraped it, so backfilling a repo doesn't render as a one-day spike.
- **Issues only** — GitHub pull requests returned by the issues endpoint are filtered out before anything is stored.
- **Deduplicated** — items are keyed by user + repo + GitHub issue id, so re-syncs never duplicate and two users can each track the same repo.

## Security notes

- **Strict CSP** — Clerk's nonce-based `script-src 'nonce-…' 'strict-dynamic'` policy is generated per request and applied in `src/proxy.ts`; Next's scripts, Clerk's loader, and the `next-themes` bootstrap all carry the nonce. The header also lists `'unsafe-inline'` from Clerk's defaults, which CSP3 browsers ignore once a nonce is present.
- **Rate limits** — `/api/sync` is keyed on the authenticated Clerk user id and `/api/cron` on the shared cron secret. Neither trusts a client-supplied `x-forwarded-for`, which is trivially rotated.
- **Webhooks** — the Clerk webhook is authenticated solely by its svix signature and is intentionally not rate-limited.
- **Secrets at rest** — LLM keys, GitHub tokens, and Slack webhooks are AES-256-GCM encrypted with `ENCRYPTION_KEY`.
- **Ownership is enforced, not assumed** — `feedback_analyses` carries a composite foreign key onto its parent item, so the two `user_id` columns cannot drift apart.
- **Accessible contrast** — every semantic color clears WCAG AA in both light and dark mode, verified in CI by `bun run contrast`.
- **Outbound SSRF** — Slack webhook URLs are rejected at write time if they are not public `https://` hosts, and requests never follow redirects.

If you sign in before your account record has synced, you'll see a "setting up your account" message — refresh a moment later.

## Checks

`bun run check` runs typecheck, lint, the contrast gate, the test suite (with a coverage floor on the tenant-isolation modules), knip, and the Drizzle migration-consistency check. `bun run db:migrate` before `bun run dev`.

## Known limits

- **Ingest is one serial pass inside a 300 s budget.** Fine for a handful of tenants; beyond that it needs a queue and a resumable cursor. `bun run db:migrate` must be applied for the alerting below to work.
- **Slack is the only notification channel.** `user_notifications.type` is an enum, so adding one is a migration plus a branch in `notification-service.ts`.

## Built with

Bun · Next.js · Neon Postgres · Drizzle · Clerk · Vercel AI SDK · Tailwind CSS
