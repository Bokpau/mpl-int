# mpl-intl — Project Instructions

International (MSC / M-Series) stats site. Frontend-only Next.js app that proxies
to the shared `mpl-ph-s17-backend`.

## Rules
- Write in plain, clear language.
- Ask clarifying questions before making assumptions. When unsure, say so.
- **Read `security-rules.md`. Always follow it when touching the API proxy
  (`app/api/[...slug]/route.js`), `lib/api.js`, environment variables, or response
  headers (`next.config.js`).** This is mandatory, not optional.
- **Read `architecture-rules.md`. Always follow it when adding a component, page, or
  data fetch — especially anything that derives a stat, series, or chart from raw
  data.** This site is a render layer; computation and raw data belong on the shared
  backend, not the browser. This is mandatory, not optional.
- Database, auth, RLS, and SQL security live in the **shared backend** and are
  governed by `mpl-ph-s17/security-rules.md` — treat that as the authority for
  anything below the proxy.
- Identity, franchise grouping, and era rules: follow `mpl-ph-s17/identity-rules.md`
  (this repo mirrors it via `lib/identity.js`).
