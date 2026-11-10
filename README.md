# Y-Mind — AI Customer Acquisition MVP

Y-Mind is a Tanzania-first prospecting and qualified-lead workspace. It provides:
- Business profile setup
- Prospect pipeline with source/evidence fields
- AI keyword suggestions (OpenAI optional; local fallback included)
- Explainable starter lead-fit scoring
- Campaign planning (draft only; no ads are launched)
- Outreach message drafting (no messages are sent by this MVP)
- CSV export
- Optional Supabase schema for multi-tenant persistence

## Important status

This is a buildable MVP scaffold. The dashboard currently stores its working data in the current browser's local storage. It is not yet a production multi-user app. Do not use it to store sensitive customer information. Supabase schema and RLS policies are included, but UI/API persistence and authenticated account flows must be connected before production.

Y-Mind cannot identify private individuals merely because they searched for a term. It uses search keyword ideas and platform-managed advertising as intent channels, plus permitted public business information and voluntary inbound leads. Do not send bulk unsolicited messages.

## Requirements

- Node.js 20+
- npm
- Optional Supabase project
- Optional OpenAI API key

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

The app works without Supabase or an AI key. Without `OPENAI_API_KEY`, keyword generation uses a local template fallback. The score endpoint is a deterministic heuristic, not a trained prediction model.

## Enable AI keyword suggestions

Set these in `.env.local`:

```env
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-4o-mini
```

Restart the development server. Never use a `NEXT_PUBLIC_` prefix for the AI key.

## Enable Supabase (database is not wired to dashboard yet)

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy the project URL and anon/publishable key into `.env.local`.
4. Implement and test authenticated server-side CRUD before real customer data or multi-user production use.

The schema has RLS policies. Never put a service-role key in browser code.

## Before production

- Connect Supabase auth and replace localStorage with authenticated server persistence.
- Add source adapters that comply with source terms and robots/API restrictions.
- Add channel-specific permission checks, suppression checks, audit logs and frequency limits.
- Integrate one official delivery provider only after reviewing applicable terms and laws.
- Verify Tanzania data protection and electronic marketing requirements.
- Add unit, API, RLS, webhook idempotency and opt-out tests.
- Add rate limiting and monitoring.
- Paid ads need the business's own approved account, permissions and advertising budget.

## Included routes

- `POST /api/ai/keywords` — keyword ideas, using OpenAI if configured
- `POST /api/ai/score` — starter fit score based on submitted fields

## Suggested next development steps

1. Wire auth and CRUD to Supabase.
2. Add public-source prospect ingestion and CSV import.
3. Add consent/eligibility gate and an outbound provider sandbox.
4. Add lead capture page and inbound webhook.
5. Add official ad connector after the organic lead workflow is validated.
