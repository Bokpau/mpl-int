# International Team Logos — Liquipedia Scrape Plan

**Purpose:** Backfill `logo_light` / `logo_dark` on the `team_era_name` table for all
15 international editions (MSC 2017–2025 + M1–M7). Currently these columns are `NULL`
for international teams (noted as a deferred refinement in INTERNATIONAL-TASKS.md line 216).

**Status (2026-06-26):** Research DONE. Scraper proof-of-concept ran successfully against
all 15 editions — 362 team-name entries extracted with logo URLs. Awaiting approval to
build the full pipeline.

---

## 1. Data Source — Liquipedia MediaWiki Parse API

### Endpoint
```
https://liquipedia.net/mobilelegends/api.php?action=parse&page={PAGE}&format=json
```

### Requirements (API Terms of Use)
- **`Accept-Encoding: gzip`** — mandatory, API returns 406 without it
- **`User-Agent`** — must be descriptive (project name + contact email)
- **Rate limit** — max 1 request/second; we use 2-second delay between requests
- **Licensing** — wiki content is CC-BY-SA 3.0; team logos are trademarked. We store
  URLs only, not the image files themselves.

### Page names (15 editions)

| Edition | Liquipedia page name |
|---|---|
| M1 | `M1_World_Championship` |
| M2 | `M2_World_Championship` |
| M3 | `M3_World_Championship` |
| M4 | `M4_World_Championship` |
| M5 | `M5_World_Championship` |
| M6 | `M6_World_Championship` |
| M7 | `M7_World_Championship` |
| MSC 2017 | `MSC/2017` |
| MSC 2018 | `MSC/2018` |
| MSC 2019 | `MSC/2019` |
| MSC 2021 | `MSC/2021` |
| MSC 2022 | `MSC/2022` |
| MSC 2023 | `MSC/2023` |
| MSC 2024 | `MSC/2024` |
| MSC 2025 | `MSC/2025` |

---

## 2. Logo HTML Structure (proven)

Team logos live inside `<span class="team-template-image-icon ...">` blocks.
Three variants:

| CSS class | Meaning | Example |
|---|---|---|
| `team-template-image-icon` (no extra class) | **allmode** — same logo for light & dark | `EVOS_Esports_allmode.png` |
| `team-template-image-icon team-template-lightmode` | Light-mode-only logo | `Todak_lightmode.png` |
| `team-template-image-icon team-template-darkmode` | Dark-mode-only logo | `Todak_darkmode.png` |

### URL structure
Thumbnail (in HTML):
```
/commons/images/thumb/{hash}/{filename}/{width}px-{filename}
```
Full-resolution (derived by stripping `/thumb` and `/{width}px-` suffix):
```
https://liquipedia.net/commons/images/{hash}/{filename}
```

### Regex used
```python
r'class="team-template-image-icon(?:\s+team-template-(lightmode|darkmode))?">'
r'\s*<a\s+href="[^"]*"\s+title="([^"]+)">'
r'\s*<img[^>]*src="(/commons/images/[^"]+)"'
```
Captures: `(mode, team_name, img_path)`.

---

## 3. Proof-of-Concept Results

All 15 editions scraped successfully:

| Edition | Teams found |
|---|---|
| M1 | 18 |
| M2 | 13 |
| M3 | 18 |
| M4 | 27 |
| M5 | 44 |
| M6 | 47 |
| M7 | 36 |
| MSC 2017 | 8 |
| MSC 2018 | 14 |
| MSC 2019 | 13 |
| MSC 2021 | 12 |
| MSC 2022 | 12 |
| MSC 2023 | 18 |
| MSC 2024 | 29 |
| MSC 2025 | 53 |
| **Total** | **362** |

Sample extracted data:
```
M1:
  TODAK:            L=Todak_lightmode.png            D=Todak_darkmode.png
  RRQ Hoshi:        L=Rex_Regum_Qeon_allmode.png     D=Rex_Regum_Qeon_allmode.png
  EVOS Legends:     L=EVOS_Esports_allmode.png       D=EVOS_Esports_allmode.png
  Blacklist Intl:   L=Blacklist_International_lightmode.png  D=Blacklist_International_darkmode.png

MSC 2025:
  SRG.OG:           L=SRG.OG_lightmode.png           D=SRG.OG_darkmode.png
  Team Falcons:     L=Team_Falcons_2022_allmode.png   D=Team_Falcons_2022_allmode.png
  Virtus.pro:       L=Virtus.pro_2019_allmode.png     D=Virtus.pro_2019_allmode.png
```

---

## 4. Implementation Steps

### Step A: Build the full scraper script

**File:** `mpl-ph-s17-backend/scrape_intl_logos.py` (new, standalone Python)

1. Fetch all 15 Liquipedia pages via the parse API (2s rate limit)
2. Extract `team_name → {logo_light_url, logo_dark_url}` per edition
3. Load existing `team_era_name` rows from the DB (`tournament_id IN (2,3)`)
   via `DATABASE_URL` from `.env`
4. **Auto-match** Liquipedia team names to `team_era_name.era_name` /
   `team_identity.display_name` per `(tournament_id, season)`:
   - Exact match first
   - Case-insensitive match
   - Fuzzy match (Levenshtein) for remaining
5. Output `intl_logo_mapping.csv`:
   ```
   edition | liquipedia_name | matched_team_key | era_name | logo_light_url | logo_dark_url | confidence
   ```
   Unmatched rows get `confidence = MANUAL`.

### Step B: Manual review (BOK)

- Review `intl_logo_mapping.csv`
- Fix any `MANUAL` rows (team names that didn't auto-match)
- Eyeball the auto-matches
- Approve the final CSV

### Step C: Generate the seed SQL

**File:** `mpl-ph-s17-backend/database/seed_team_logos_intl.sql` (new)

Generated from the approved CSV. Same pattern as `seed_team_logos_ph.sql`:
```sql
INSERT INTO team_era_name (tournament_id, season, team_key, era_code, era_name, logo_light, logo_dark)
VALUES
  (2, 'MSC 2025', '68a6d39d85024519123145d0', 'SRG OG', 'Selangor Red Giants OG Esports',
   'https://liquipedia.net/commons/images/x/xx/SRG.OG_lightmode.png',
   'https://liquipedia.net/commons/images/y/yy/SRG.OG_darkmode.png'),
  ...
ON CONFLICT (tournament_id, season, team_key) DO UPDATE
  SET logo_light = EXCLUDED.logo_light,
      logo_dark  = EXCLUDED.logo_dark;
```

This is **safe** — `ON CONFLICT DO UPDATE` only touches the two logo columns;
`era_code` and `era_name` are in the INSERT for the conflict key but the UPDATE
clause only sets `logo_light`/`logo_dark`.

### Step D: Apply to prod

Run the SQL via a temp node script (per gotcha #1 in INTERNATIONAL-TASKS.md)
or `psql $DATABASE_URL -f database/seed_team_logos_intl.sql`.

---

## 5. Key Challenge — Name Matching

Liquipedia team names ≠ our `era_name` in many cases:

| Liquipedia name | Our `era_name` | Notes |
|---|---|---|
| `EVOS Legends` | `EVOS Glory` | Same org, different era name |
| `Fnatic ONIC PH` | `Fnatic ONIC Philippines` | Abbreviation difference |
| `SRG.OG` | `Selangor Red Giants OG Esports` | Shortened |
| `AP.Bren` | `AP Bren` / `Falcons AP Bren` | Dot vs space, rename |
| `Liquid Echo` | `Team Liquid PH` | Different branding |
| `ONIC` vs `ONIC Esports` | Both map to same `team_key` | Duplicate entries |
| `RSG Singapore` vs `RSG Slate SG` | Same team, era rename | |

The auto-matcher handles the easy cases; the CSV review step (Step B) catches the rest.
There are 239 `team_era_name` rows for `tournament_id IN (2,3)` and 362 Liquipedia
entries (some are duplicates from bracket/group references), so the mapping is dense
but not 1:1 — manual review is essential.

---

## 6. Decisions Needed

### Q1: Store URL or download + re-host?

**Option A (recommended):** Store the Liquipedia full-res URL directly in
`logo_light`/`logo_dark`, same as PH logos store `media.aerena.gg` URLs.
- Pro: Zero hosting cost, no image pipeline needed
- Con: External dependency — if Liquipedia changes URLs, logos break

**Option B:** Download PNGs and host on our own CDN (e.g. raw GitHub or the
existing aerena media pattern).
- Pro: No external dependency
- Con: Extra work, needs a hosting decision, copyright considerations

### Q2: Per-edition logos or single canonical?

**Option A (recommended):** Use per-edition logos from Liquipedia. Each
`(tournament_id, season, team_key)` row gets the logo shown on that edition's
Liquipedia page. This is the most historically accurate — teams like ONIC changed
logos between M3 and M4.

**Option B:** Pick the most recent Liquipedia logo per `team_key` and use it
across all editions. Simpler but historically inaccurate.

---

## 7. Verification

### Automated
```bash
# Count how many intl team_era_name rows have logos after applying
psql $DATABASE_URL -c "
  SELECT
    tournament_id,
    COUNT(*) AS total,
    COUNT(logo_light) AS has_light,
    COUNT(logo_dark) AS has_dark
  FROM team_era_name
  WHERE tournament_id IN (2,3)
  GROUP BY tournament_id;
"
```

### Manual
- Spot-check 5–10 logo URLs in a browser → confirm correct team logo renders
- Check `/teams` page on `mpl-int.vercel.app` once the frontend reads
  `logo_light`/`logo_dark` from the `/api/intl/teams` endpoint

---

## 8. File Inventory

| File | Status | Purpose |
|---|---|---|
| `INTERNATIONAL-LOGOS-PLAN.md` (this file) | NEW | Plan document |
| `mpl-ph-s17-backend/scrape_intl_logos.py` | TO BUILD | Scraper + matcher script |
| `mpl-ph-s17-backend/database/seed_team_logos_intl.sql` | TO GENERATE | Logo seed SQL |
| `intl_logo_mapping.csv` | TO GENERATE | Review CSV (not committed) |
