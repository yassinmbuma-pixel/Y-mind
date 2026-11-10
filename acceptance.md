# Y-Mind MVP acceptance tests

These are manual/automated test cases to implement before live deployment.

1. Missing business name/category/description prevents profile save.
2. Empty prospect cannot be saved without organization name, email or phone.
3. Every imported prospect records source type and preferably source URL.
4. Lead score is always an integer from 0 to 100.
5. UI makes clear that a fit score is not evidence of a recent individual search.
6. Campaign creation stores a draft and never launches or spends on ads.
7. Outreach draft never sends a message.
8. Outbound integration (future) rejects missing/invalid permission basis.
9. Outbound integration (future) rejects suppressed destinations even when previously approved.
10. Repeated send requests use idempotency and do not double-send.
11. Tenant A cannot read or modify Tenant B data (test Supabase RLS).
12. API keys are server-only and never included in client bundles.
13. AI output is validated against a schema and bounded in length.
14. Provider errors do not create unlimited retries.
15. Opt-out is persisted and honored before processing queued tasks.
16. CSV export correctly escapes commas, quotes and line breaks.
17. AI endpoint handles malformed JSON and provider timeout safely.
18. Business can manually correct a lead score/status and export records.
