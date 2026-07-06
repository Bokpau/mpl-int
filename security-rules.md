# Security Rules — International Site (`mpl-intl`)

MANDATORY. Follow these for every edit to `mpl-intl`. When in doubt, re-read this
file before touching the API proxy, environment variables, or response headers.

This site is **frontend-only**. It has **no** database client, **no** Supabase
client, **no** auth, and **no** service-role key of its own. All database-level
security (RLS, `security_invoker` views, SQL-injection defense, auth) lives in the
**shared backend** and is governed by
`mpl-ph-s17/security-rules.md` — that file is the authority for anything below the
proxy. Do not duplicate or contradict it here.

## How data reaches this site (the mental model)

```
Supabase DB
  → mpl-ph-s17-backend (Render, `postgres` role, bypasses RLS, read/write)
    → mpl-intl Next.js proxy  (app/api/[...slug]/route.js, attaches x-api-key)
      → browser  (fetches same-origin /api/intl/* only)
```

The browser **never** sees the backend URL or the internal API key. It only ever
calls this site's own `/api/intl/*` routes. Keep it that way.

## Rule 1 — The internal API key stays server-only

- `INTERNAL_API_KEY` and `BACKEND_URL` are **server-only**. They must **never**:
  - use a `NEXT_PUBLIC_` prefix,
  - be imported into a client component (`'use client'`),
  - be committed to git, logged, or sent to the browser.
- The key is attached to backend requests in exactly two server-side places:
  `app/api/[...slug]/route.js` (the browser proxy) and `lib/api.js` (server
  fetches). Do not add a third path.
- `INTERNAL_API_KEY` must be **identical** to the backend's `INTERNAL_API_KEY`
  (set in Render and Vercel). Changing one means changing both.

## Rule 2 — Client components fetch through the proxy, never the backend directly

- Any `'use client'` component that needs data must `fetch('/api/intl/...')`
  (same-origin). It must **not** fetch the backend origin directly — that would
  require shipping the key to the browser.
- Server components / server actions may use `lib/api.js`, which talks to the
  backend directly with the key on the server.

## Rule 3 — The proxy is scoped, read-only, and input-validated

`app/api/[...slug]/route.js` is the only public entry to the backend. Keep all of
these true:

- **Scoped to `intl/*`.** The first path segment must be `intl`. Never widen it to
  forward arbitrary backend paths — that turns this deployment into an
  authenticated open proxy for the whole PH backend.
- **GET only.** Do not add `POST`/`PUT`/`PATCH`/`DELETE` handlers or forward write
  or `/admin/*` endpoints. This site is read-only. Admin/sync happens on the
  backend, not through here.
- **Path validation stays.** Keep the depth cap (`MAX_SLUG_DEPTH`) and the
  rejection of empty / `.` / `..` / slash / backslash segments (path-traversal
  defense), and keep `encodeURIComponent` on each segment.
- **No raw request value is interpolated into a backend path or SQL.** User input
  reaches the backend only as encoded path segments or as the canonicalized query
  string — never concatenated into a SQL string here (this site has no DB), and
  never into the backend URL unescaped.

## Rule 4 — HTTP response headers

- Security headers are defined **once**, in `next.config.js` `headers()` (so they
  apply in `next dev` and on Vercel). Do **not** re-add a `headers` block to
  `vercel.json` — duplicated headers drift and conflict.
- The required set: `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy`, `Permissions-Policy` (and the legacy `X-XSS-Protection`).
- When you add a **new external origin** (image CDN, font host, analytics, an API
  the browser calls directly), you must widen the matching CSP directive
  (`img-src` / `font-src` / `style-src` / `connect-src`) in `next.config.js`, or
  the browser will silently block it. Widen by exact origin — never fall back to a
  blanket `*` or add `'unsafe-eval'` to production `script-src`.

## Rule 5 — Environment variables

- Secrets live in the hosting dashboards, never in git:
  - **Vercel (`mpl-intl`):** `INTERNAL_API_KEY`, `BACKEND_URL`, and any
    server-only config (e.g. `FEATURED_EDITION`).
- Only `NEXT_PUBLIC_*` values may appear in the browser. Everything else is
  server-only. `.env` / `.env.local` stay gitignored and untracked.
- `.env.local.example` documents the shape with **placeholder** values only —
  never real secrets.

## Rule 6 — Secret-scanning pre-commit hook

- A pre-commit guard lives at `.githooks/pre-commit` (tracked, version-controlled).
  It blocks a commit that stages an env/key file or a credential-shaped value
  (JWTs, Supabase keys, DB connection strings, hardcoded `INTERNAL_API_KEY` /
  `ADMIN_PASSWORD` / etc.), and runs `gitleaks` too if it is installed.
- It is enabled via `core.hooksPath` and auto-configured by the `prepare` script
  on `npm install`. To enable manually: `git config core.hooksPath .githooks`.
- Do not remove or weaken the hook. Never commit real secrets with `--no-verify`
  to get past it — fix the leak instead.

## Rule 7 — Verify before calling it done

When you touch the proxy, a fetch path, env vars, or headers, confirm:

- [ ] No server-only secret gained a `NEXT_PUBLIC_` prefix or entered a
      `'use client'` file. (`grep -rn "INTERNAL_API_KEY\|BACKEND_URL" app components`
      should only match the two server files.)
- [ ] The proxy still rejects a non-`intl` path:
      `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/players`
      → `400` (not `200`).
- [ ] A valid intl path still works:
      `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/intl/overview`
      → `200`.
- [ ] Security headers are present on a page response:
      `curl -sI http://localhost:3000/ | grep -i "content-security-policy\|strict-transport"`.
- [ ] The site still renders — no CSP violations in the browser console (check
      after any new external image/font/API origin).
