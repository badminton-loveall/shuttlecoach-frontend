# Autopilot-safe React + Vercel + Postgres Prompt Kit

This kit is designed for autonomous coding agents such as Kiro Autopilot, where task size and scope control matter more than in normal chat mode.

## What is different
- Prompts are chunked more aggressively.
- Broad tasks are split before implementation.
- The rules discourage cross-layer changes in one run.
- The prompt builder can generate autopilot-safe prompts automatically.

## Included files
- `AGENTS.md`
- `PROJECT_CONTEXT.md`
- `PROMPT_TEMPLATES.md`
- `prompt-builder.js`

## Usage

```bash
node prompt-builder.js --task "fix validation message alignment in login form" --files "src/components/LoginForm.tsx" --autopilot-safe
```

```bash
node prompt-builder.js --task "deploy app to Vercel with missing preview env vars" --files "vercel.json,.env.example" --autopilot-safe
```

```bash
node prompt-builder.js --task "add company profile feature with UI, API, DB, and deploy changes" --autopilot-safe
```

The third example should trigger chunking guidance instead of one large implementation.