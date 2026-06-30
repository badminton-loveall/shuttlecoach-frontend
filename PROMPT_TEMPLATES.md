# PROMPT_TEMPLATES.md

These templates are optimized for Autopilot-safe execution.

## 1) Autopilot-safe task

```md
Mode: autopilot-safe

Task goal:
[One narrowly scoped result only.]

Allowed scope:
- Layer: [UI / API / database / deployment / docs]
- Files: [prefer 1-3 exact files]
- Max file count: [number]

Do not do:
- Do not expand into other layers.
- Do not refactor unrelated code.
- Do not add optional improvements.
- Do not write docs/tests unless explicitly requested.

Expected output:
- Brief plan
- Exact changes for this chunk only
- Short note on what should be done next, if anything
```

## 2) Broad request splitter

```md
Mode: autopilot-safe

The request may be too broad for one autonomous run.
First, break it into the smallest safe chunks.
Return only:
1. Chunk list
2. Recommended first chunk
3. Files likely affected in chunk 1
4. Wait for approval before implementing later chunks
```

## 3) Autopilot-safe React UI task

```md
Mode: autopilot-safe

Task goal:
[One UI improvement only.]

Allowed scope:
- Layer: UI only
- Files: [exact component files]
- Max file count: 3

Do not do:
- Do not change API calls, business logic, validation, or state shape.
- Do not redesign unrelated screens.

Expected output:
- Updated component code only
- Minimal style updates only
```

## 4) Autopilot-safe DB task

```md
Mode: autopilot-safe

Task goal:
[One DB change only.]

Allowed scope:
- Layer: database only
- Files: [schema or migration files]
- Max file count: 3

Do not do:
- Do not redesign schema.
- Do not modify unrelated queries.

Expected output:
- Migration SQL
- Rollback note
- Small note for required app-side follow-up
```

## 5) Autopilot-safe deploy task

```md
Mode: autopilot-safe

Task goal:
[One deployment/config change only.]

Allowed scope:
- Layer: deployment only
- Files: [vercel.json / package.json / .env.example / config files]
- Max file count: 3

Do not do:
- Do not refactor app code.
- Do not add infra not required for Vercel.

Expected output:
- Exact config change
- Exact env vars
- Commands to run
```