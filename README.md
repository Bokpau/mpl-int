# MLBB International (working title)

Separate Next.js frontend for the **MSC** and **M-Series World Championship** stats,
sharing the same Supabase DB + backend proxy + identity system as the MPL PH S17 site.
This is the **Phase E skeleton** from `INTERNATIONAL-TASKS.md` / `INTERNATIONAL-EVENTS-PLAN.md`
(in the `mpl-ph-s17` repo).

## What's here

A self-contained app (plain CSS, no Tailwind) that reads the backend's `/api/intl/*` routes:

| Route | Page |
|---|---|
| `/` | Player leaderboard (career rollups by stable `player_key`) |
| `/players/[key]` | One player's international career — totals, by-edition, hero pool |
| `/teams` | Team leaderboard (by stable `team_key`) |
| `/teams/[key]` | One team's history — totals, by-edition, roster, heroes |
| `/heroes` | Hero pick/win%/KDA across the selection |

A global **filter bar** (in the nav) drives three URL params forwarded to every call:
`scope` (All / MSC / M-Series), `season` (edition), `stage` (Total / Main / Wildcard).

Not in this skeleton (Phase F): Nations/Regions, Group stage, Bracket, Region head-to-head.

## How data flows

Pages are server components that call `lib/api.js`, which hits `BACKEND_URL` directly with
the `x-api-key` header. **`BACKEND_URL` and `INTERNAL_API_KEY` are server-only** (no
`NEXT_PUBLIC_` prefix) so the key never reaches the browser. Client components should use
the catch-all proxy at `app/api/[...slug]/route.js`, which attaches the key server-side.

## Setup

```bash
cp .env.local.example .env.local   # fill in BACKEND_URL + INTERNAL_API_KEY
npm install
npm run dev                        # http://localhost:3100
```

> The `/api/intl/*` routes must be deployed (or a backend running locally) for data to load.
> Until then, pages render the shell with a "couldn't load data" notice.

## Notes / TODO

- Branding is a placeholder (`MLBB International`) and the site is `noindex` until the
  domain/branding decision (D6) is made.
- No auth gate yet (the PH site gates everything behind `/login`); add one if this should
  stay private before launch.
