# Move Computation to the Backend — Audit + Plan

*Community 4 · 38 nodes*

## Files
- [architecture-rules.md](file:///Users/bok/Documents/GitHub/mpl-intl/architecture-rules.md)
- [plans/backend-computation-offload-plan.md](file:///Users/bok/Documents/GitHub/mpl-intl/plans/backend-computation-offload-plan.md)
- [plans/current-vs-history-rules.md](file:///Users/bok/Documents/GitHub/mpl-intl/plans/current-vs-history-rules.md)

## Key symbols
- `Architecture Rules — International Site (`mpl-intl`)` (document) — architecture-rules.md:L1
- `Move Computation to the Backend — Audit + Plan` (document) — plans/backend-computation-offload-plan.md:L1
- `MANDATORY: Current-Tournament vs History Identity Rules` (document) — plans/current-vs-history-rules.md:L1
- `backend-computation-offload-plan.md` (document) — plans/backend-computation-offload-plan.md:L1
- `architecture-rules.md` (document) — architecture-rules.md:L1
- `current-vs-history-rules.md` (document) — plans/current-vs-history-rules.md:L1
- `The mental model` (document) — architecture-rules.md:L14
- `Rule 1 — Raw per-frame / per-event data is aggregated on the backend` (document) — architecture-rules.md:L27
- `Rule 2 — Statistical formulas live in the backend` (document) — architecture-rules.md:L34
- `Rule 3 — `'use client'` components do not aggregate raw data` (document) — architecture-rules.md:L42
- `Rule 4 — Images are served through jsDelivr, never `raw.githubusercontent.com`` (document) — architecture-rules.md:L49
- `What IS allowed on the client (not a violation)` (document) — architecture-rules.md:L69
- `Known accepted exceptions (as of 2026-07-06)` (document) — architecture-rules.md:L83
- `When you add or change a feature` (document) — architecture-rules.md:L97
- `Enforcement` (document) — architecture-rules.md:L104
- `Reference: key `lib/` files` (document) — architecture-rules.md:L113
- `Reference: two data tiers` (document) — architecture-rules.md:L127
- `Reference: featured edition & filter resolution` (document) — architecture-rules.md:L132
- `Reference: `eraTeams` vs `teams`` (document) — architecture-rules.md:L136
- `Reference: `tournament_stage`` (document) — architecture-rules.md:L141
- `Execution status (2026-07-06)` (document) — plans/backend-computation-offload-plan.md:L11
- `Decisions (locked with BOK, 2026-07-06)` (document) — plans/backend-computation-offload-plan.md:L37
- `Why (the problem)` (document) — plans/backend-computation-offload-plan.md:L66
- `Non-goals (correctly staying in the frontend)` (document) — plans/backend-computation-offload-plan.md:L92
- `Phase 1 — Role/gold-diff series → backend (highest impact)` (document) — plans/backend-computation-offload-plan.md:L104
- `Phase 2 — Series rollup (buildSeries / computeDecider) → backend` (document) — plans/backend-computation-offload-plan.md:L137
- `Phase 3 — Identity resolver exposure (IN scope)` (document) — plans/backend-computation-offload-plan.md:L176
- `Phase 4 — Guardrail (prevent regression)` (document) — plans/backend-computation-offload-plan.md:L204
- `Cross-repo & deploy notes` (document) — plans/backend-computation-offload-plan.md:L215
- `Verification per phase` (document) — plans/backend-computation-offload-plan.md:L227
- `Resolved decisions (2026-07-06)` (document) — plans/backend-computation-offload-plan.md:L240
- `0. Decisions (locked with BOK, 2026-07-06)` (document) — plans/current-vs-history-rules.md:L14
- `1. The three-layer contract (all three must hold)` (document) — plans/current-vs-history-rules.md:L26
- `2. The mandatory resolver (`lib/identity.js`)` (document) — plans/current-vs-history-rules.md:L44
- `3. Team display — field contract by Surface × Context` (document) — plans/current-vs-history-rules.md:L57
- `4. Player name & photo` (document) — plans/current-vs-history-rules.md:L85
- `5. Route separation & locking` (document) — plans/current-vs-history-rules.md:L99
- `6. Checklists` (document) — plans/current-vs-history-rules.md:L108

<!-- graphify:notes -->
## Notes

