# AGENTS.md

ShuttleCoach — React/Vite/TypeScript SPA for badminton coaching management.

## Scope limits
- One task per run. One layer (UI, API, DB, deploy, or docs) when possible.
- Prefer 1–3 files per change; exceed 5 only if explicitly required.
- If a request is broad, return a chunked plan and execute only chunk 1.

## Execution behavior
- Ask clarifying questions only when a missing detail blocks execution.
- Prefer incremental, reviewable progress over large sweeping changes.
- Stop after the requested bounded task is complete.

## Do not read
- `node_modules/`, `dist/`, `.git/`
- `TASK_*_COMPLETION_SUMMARY.md` files (historical, load only if explicitly referenced)

## Stack & conventions
- See `PROJECT_CONTEXT.md` for full stack details and conventions.
- See `.kiro/steering/conventions.md` for coding patterns and guardrails.
- Domain-specific rules (DB, deployment) are in conditional steering files that load automatically when relevant files are touched.

## Rate-limit handling
- Keep one active task at a time.
- On rate limit: wait 10s → 20s → 40s → 60s max, then stop.
