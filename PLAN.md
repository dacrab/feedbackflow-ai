# StartupExpert Project Brief:

# FeedbackFlow AI

## 1) Title & One-liner

**FeedbackFlow AI:** An automated micro-SaaS platform to ingest, analyze, and triage real-world
B2B/B2C public reviews using LLMs.

## 2) Problem & Who Benefits

**The Problem:** Small-to-medium businesses (SMBs) struggle to manually consolidate and
analyze the high volume of unstructured customer feedback scattered across public platforms
like Trustpilot and app stores. This lack of automated insight leads to delayed response times
and a failure to quickly identify critical product issues. **Who Benefits:** This tool is designed for
**Product Managers and Customer Success Teams at B2B/B2C SaaS companies** who need a
centralized, automated system to monitor public opinion, prioritize bug fixes, and validate
feature requests efficiently.

## 3) Feature Set (Must-Have)

```
Component Description
Auth Secure signup/signin for users. All UI routes and API endpoints must be
protected.
LLM
Integration
The core processing engine. The LLM must perform a multi-task analysis on
each piece of incoming feedback. Output must be a structured JSON object. -
Sentiment Analysis (Positive, Neutral, Negative). - Topic Classification (e.g.,
Bug Report, Feature Request, Pricing, Performance). - Severity Scoring
(Assign a priority score: 1-5). - Summarization (Generate a concise
one-sentence summary).
```

```
Cron
Pattern A
(Real Ingest)
A scheduled job runs daily. 1. Real Data Source: You must select and
integrate with ONE real, public source from the suggested categories below
to fetch raw data. You must handle all necessary API keys, authentication, or
scraping logic. Required Data Source Categories (Choose One): *
B2B/B2C Reviews: Data from Google Reviews , Trustpilot , or Capterra. (If no
official free API is available, you may use a daily scraping job for initial data
ingestion. Note that scraping reliability must be addressed.) * Alternative
Stable API: GitHub Issues API (monitoring a public repository for bug
reports). 2. Ingest & Process: The job retrieves new data , stores the raw
content, calls the LLM for analysis, and stores the structured results. Must
include basic retry/error logging for data fetching and LLM calls.
Database Persist users. Store feedback_items (original content, source, timestamp,
external ID) and feedback_analyses (LLM results, linked to items).
UI A clean, functional interface with: - Dashboard: Overview with charts
showing sentiment trends and topic distribution. - Feedback Inbox: A list
view of all ingested feedback, sortable and filterable by sentiment, topic, and
severity. - Detail View: Shows the full raw content alongside the detailed,
structured AI analysis.
```
## 4) Bonus / Stretch

```
● Webhooks: Set up outgoing webhooks (e.g., to a Slack channel) to instantly notify the
team when feedback with a severity score ≥4 is detected.
● User-Queued Actions (Cron Pattern B): Allow users to "triage" feedback by assigning a
status (New, Acknowledged, Actioned). A second daily cron job could dispatch a
summary email digest.
● Idempotency & Reliability: Implement robust checks (using an external_id) to prevent
duplicate records and handle potential scraping failures or API rate limits gracefully.
```
### 5) Deployment Requirements

The entire application ( **frontend** , **backend automation** , **database** ) should be deployed with **Neon Postgres + Vercel** as the core platform:
● **Frontend:** Deployed on **Vercel** with a **custom domain** (e.g.,
feedbackflow.dev or a similar professional domain). Preview URLs alone are **not sufficient** — a proper domain is required.
● **Backend & Automation:** Implement daily ingest via **Vercel Cron Jobs** calling Next.js API routes (e.g. `/api/ingest`, `/api/digest`). Alternative: Postgres **pg_cron** if you prefer DB‑side scheduling.


```
● Database: **Neon Postgres** (managed Postgres with Drizzle migrations; RLS optional but recommended).
● Evidence Required: In the deliverables, include a demo video showing:
○ The Neon project dashboard and a brief look at the schema.
○ Vercel Cron configuration for the daily ingest/digest jobs and logs of a successful run.
○ New data visible in the UI after ingestion.
○ Any other service used (e.g., Vercel, Slack), explaining its role.
```
## 6) Example of the Data Model

```
● User (app_users): id (uuid), email (citext, unique), created_at
● FeedbackItem: id, user_id (FK→app_users), source, external_id (unique per user+source),
raw_content, original_timestamp, created_at
● FeedbackAnalysis: id, user_id (FK→app_users), feedback_item_id (FK),
sentiment (enum: positive/neutral/negative), topics (jsonb array of strings),
severity_score (1..5), summary, status (enum: New/Acknowledged/Actioned), created_at
● AnalysisTopic (analysis_topics): id, feedback_analysis_id (FK), user_id (FK), topic (text)
```
## 6) Architecture (Concise)

**[Frontend (Next.js + Tailwind)]**
↓ Auth (**Better Auth**)
**[API Layer (Next.js API Routes + Drizzle ORM over Neon)]**
├── Auth Controller → Users
├── Feedback Controller → FeedbackItem + FeedbackAnalysis
├── Dashboard Controller → Aggregated metrics
└── Webhook Controller (optional)
↓
**[Database: Neon Postgres]**
↑
**[Cron Job: Vercel Cron (daily) or pg_cron]**
1 ⃣ Fetch new feedback
2 ⃣ Deduplicate
3 ⃣ Call LLM (OpenAI / Anthropic / Google)
4 ⃣ Store analysis + logs
↘

### Database & schema notes
- Enums for `sentiment` and `status` improve data integrity and simplify filters.
- `user` table is managed by Better Auth; emails are stored case‑normalized and unique.
- `analysis_topics` is a normalized, queryable view of topics; it is kept in sync with `feedback_analyses.topics`.
- All tables are user‑scoped (`user_id`), with owner‑only access enforced by application queries and optional Neon RLS.


**[External APIs]**

- LLM Provider
- Feedback Sources (App Store API, RSS, or Mock)
- Stripe / Slack (bonus)

## 7) Acceptance Criteria (Checklist)

```
Category Criterion
Auth Secure signup/login is functional. Protected routes redirect logged-out users.
Cron &
Ingest
The daily cron job successfully retrieves new, real data from the chosen
source (via API or scraping) and stores the raw content.
LLM For each new item, a corresponding FeedbackAnalysis record is created with
structured data from the LLM.
Reliability The cron job handles potential failures (e.g., blocked scraper, API key error)
and logs them.
UI The Inbox lists feedback and can be filtered/sorted by severity and topic.
Security All critical secrets (DB connection, LLM key) are loaded from environment
variables, not hardcoded.
```
## 8) Grading Rubric

```
Area Points Description
Backend & Cron
Reliability
20 Robustness of the Cron job, correct handling of the Real
External API / Scraping (retries, idempotency).
Architecture & Ops 15 Quality of cloud architecture, effective use of logging and
monitoring, and deployment strategy.
Auth & Security 10 Secure implementation of protected routes, no secrets
leaked (via hardcoding/logs), and correct loading of
environment variables.
Frontend & UX 20 Functionality, clarity of the UI, correct display of charts,
and effective use of filtering/sorting logic.
```

```
LLM Integration
Quality
15 Usefulness of the LLM analysis, successful structured
(JSON) output parsing, and effective error handling for the
LLM API.
Data Model &
Persistence
10 Logical and efficient database schema design, use of
indexes, and correctness of data persistence.
Deliverables &
Professionalism
10 Quality of the README, video demo, and clear commit
history.
TOTAL 100
```
## 9) Tools to Use

**You’re encouraged to utilize AI tools to help accelerate project implementation. Some
recommended tools:
● v0 / lovable
● Cursor / Windsurf / Claude Code /Codex
● ChatGPT / Gemini /Claude**

#### Happy coding, and let’s build your superpowers together!