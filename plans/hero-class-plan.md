# Hero Class / Specialty / Release Date — mpl-intl rollout plan

**Status:** not started. Backend data + PH-facing API already shipped (Phase 0+1, 2026-08-06).
**Owner:** BOK
**Prereq:** `mpl-ph-s17-backend/database/migration_hero_class_2026-08-06.sql` and
`seed_hero_class.sql` applied to the shared Supabase database.

---

## What already exists

The shared `heroes` reference table now carries the official MLBB hero archetype
and release date for all 133 heroes:

| Column | Type | Notes |
|---|---|---|
| `class_primary` | varchar(20) | Tank / Fighter / Assassin / Mage / Marksman / Support |
| `class_secondary` | varchar(20) | nullable — 35 heroes have one |
| `specialty_1` | varchar(30) | Burst, Chase, Charge, Crowd Control, Damage, Finisher, Guard, Initiator, Magic Damage, Mixed Damage, Poke, Push, Regen, Support |
| `specialty_2` | varchar(30) | nullable |
| `release_date` | date | padded to the 1st / Jan 1st when only month or year is known |
| `release_year` | smallint | |
| `release_precision` | varchar(5) | `day` \| `month` \| `year` — how much of `release_date` is real |

Source of truth is `mpl-ph-s17-backend/mlbb_heroes_roles.md`. The SQL seed is
generated from it — never hand-edit `seed_hero_class.sql`:

```bash
node database/gen_hero_class_seed.js
```

The generator refuses to write anything if a hero name doesn't resolve, a class
or specialty is outside the allowed vocabulary, or a hero is missing from either
side. CHECK constraints in the DB enforce the same vocabulary.

### Class ≠ role. Do not conflate.

Everywhere in both codebases, **"role" means LANE** (`EXP LANE`, `JUNGLE`,
`MID LANE`, `ROAM`, `GOLD LANE` — stored in `role_lane`). The new field is
**"class"**. Never name a variable, param, column, or UI label in a way that
blurs them. Both sites already have a lane-role filter on the heroes page; the
class filter is a *second, independent* filter, and the two combine (e.g. Mages
played in ROAM).

### Class never enters stat math

Class is a descriptive tag for display, filtering, and grouping in the UI only.
It must not become a grouping key in any aggregation that claims to describe how
a hero was played — pro drafts ignore official classes constantly (Edith is a
Tank on paper and gets played gold/roam). Anything that measures play must keep
using `role_lane`.

---

## Phase A — backend: expose on the intl routes

All of these live in `mpl-ph-s17-backend/index.js`. Mirror exactly what was done
for the PH routes.

1. **`GET /api/intl/heroes`** — the list already ends with a join onto `heroes h`
   (after grouping by `LOWER(p.hero_name)`). Add to the outer SELECT:
   `h.class_primary, h.class_secondary, h.specialty_1, h.specialty_2,
   h.release_date, h.release_year, h.release_precision`.
   Then add an optional `hero_class` query param, filtering
   `(h.class_primary = $n OR h.class_secondary = $n)` — matching *either* slot,
   same semantics as `/api/stats/heroes?hero_class=`.
   Keep it separate from the existing `role` param.

2. **`GET /api/intl/heroes/:heroid/overview`** — this route resolves the hero via
   `getHeroNameById()`. Add the class fields to the response object using the
   cached `getHeroClassMap()` helper (already defined in `index.js`, keyed on
   lowercased `hero_name`, 1h TTL). Null-safe: a hero the reference table
   doesn't know just returns nulls, no error.

3. Leave `/api/intl/heroes/:heroid/{synergy,vs-teams,win-loss}` alone — they are
   per-matchup payloads and don't need hero metadata.

4. **Do not add class to any aggregation table or view.** It is reference data;
   join it at read time.

**Verify:** `curl` each route, confirm the fields are present and that
`?hero_class=Tank` returns Esmeralda (Tank/Mage) as well as Atlas (Tank only).
Additive fields, so no frontend deploy is required to make this safe.

---

## Phase B — frontend: mpl-intl UI

Match whatever the PH site ends up doing, so the two stay visually consistent.

1. **`components/ClassBadge.js`** (new) — small chip rendering
   `class_primary` (+ `class_secondary` in a muted style). One colour per class,
   tokens added to `DESIGN.md`. No icon assets exist for classes in `mlbb-tool`,
   so this is text-only for now; if class icons get added there later, swap the
   chip contents without touching call sites.

2. **`app/heroes/page.js`** — add a Class column and a class filter row.
   Label the two filters explicitly **"Lane"** and **"Class"** so nobody reads
   the second one as a duplicate of the first. Wire the filter to
   `?hero_class=`; don't filter client-side, the backend param exists.

3. **`app/heroes/[heroid]/page.js` / `CurrentHeroDashboard.js`** — header line
   under the hero name: class (+ secondary), both specialties, and release date
   rendered per `release_precision`:
   - `day` → `17 Jun 2026`
   - `month` → `Jul 2017`
   - `year` → `2016`
   Never print a day the data doesn't have.

4. **`components/views/HeroStatsView.js` / `CurrentHeroStatsView.js`** — class
   column in the shared table view, sortable.

5. **`app/history/heroes/page.js`** — same badge + class filter. The historical
   routes (`/api/historical/heroes`, `/api/historical/heroes/:hero`) already
   return the class fields as of the PH Phase 1 change, so no backend work is
   needed for the history section.

**Verify:** load the heroes list, a hero detail page, and a history hero page.
Check a hero with a secondary class (Esmeralda, Edith, Roger), a hero with one
specialty only (Uranus — Regen), and a year-only release (any 2016 hero).

---

## Phase C — analytics this unlocks (optional, decide later)

Only start these after A and B are live and verified. Each is a separate plan:

- Draft class composition per team (how many Tanks/Mages a team drafts).
- Class-vs-class matchup win rates from the draft tables.
- Meta shift by patch — e.g. share of games with 2+ Assassins.
- Hero age (`release_year`) vs pick rate: does the meta favour new releases?

---

## Maintenance — when a new hero ships

1. Add the hero to `mpl-ph-s17-backend/database/seed.sql` (heroid + name) as usual.
2. Add the row to `mlbb_heroes_roles.md` (class, secondary, specialty, release date).
3. `node database/gen_hero_class_seed.js` — it will fail loudly if step 1 or 2
   was missed or misspelled.
4. Apply the regenerated `seed_hero_class.sql`. It's an idempotent UPDATE keyed
   on heroid, safe to re-run.

The markdown's row numbers are **not** heroids — they diverge from `#61` onward
(doc `#66` is Belerick, heroid 66 is Vale). Everything matches on name. Don't
"fix" the generator to use the numbers.
