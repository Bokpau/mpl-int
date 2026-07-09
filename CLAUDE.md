# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# mpl-intl

Frontend-only Next.js app (MSC / M-Series stats). Proxies to `mpl-ph-s17-backend`. No DB, no auth, no write operations — render layer only.

## Commands

```bash
cp .env.local.example .env.local   # fill in BACKEND_URL + INTERNAL_API_KEY
npm install
npm run dev     # http://localhost:3100
npm run build
npm run lint
```

Local backend: set `BACKEND_URL=http://localhost:3001`. Season param is always the full string (`"MSC 2026"`, not `"2026"`). No test suite — verify by running the page in the browser.

## Mandatory rules

- **Proxy / API / env vars / headers** → read `security-rules.md` first. The `INTERNAL_API_KEY` is server-only; client components fetch `/api/intl/*` (proxy), never the backend directly.
- **Components, pages, data fetches, images** → read `architecture-rules.md` first. Stats are computed on the backend; the frontend only renders. Images go through jsDelivr via `cdnify()` / `img.*` — never `raw.githubusercontent.com`.
- **Team identity** → always use `lib/identity.js` `resolveTeam()`. Era fields for season/current pages; franchise fields for all-time aggregates.
- **Identity, franchise grouping, era rules** → `lib/identity.js` mirrors `mpl-ph-s17/identity-rules.md`.
- **After finishing a task or plan** → run `graphify update .` to keep the knowledge graph current.
