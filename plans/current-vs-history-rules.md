# Mandatory Rules: Current Tournament vs. Historical Data

This document defines the mandatory rules and display guidelines for handling current tournament data versus historical data. All frontend components, routes, and views must adhere to these rules.

---

## 1. Naming & Branding Guidelines

### Player Name Display
1. **Current Tournament Pages** (all pages outside `/history`):
   - Display the player's era-specific IGN for the current tournament. This is authoritative from the `player` field returned by the backend (already corrected in the API).
2. **History Pages - Season-Filtered** (under `/history/...` with a specific season selected):
   - Display the player's era-specific IGN followed by their stable global name in parentheses to prevent confusion.
   - Format: `[Era IGN] ([Global Name])`, e.g., `FULLCLIP (Kairi)`.
3. **History Pages - All-Time / Aggregate** (under `/history/...` with no specific season filter, showing all-time leaderboards):
   - Display the player's latest global display name (e.g., `Kairi`).

### Player Photo Display
1. **Current Tournament Pages**:
   - Display the player's photo for the current tournament (`photo_url`).
   - **Fallback:** Initials Avatar (e.g., a circle with the first letter of their name, such as `K` for Kairi). Do not fallback to team logos.
2. **History Pages**:
   - Display the player's era-specific photo if available.
   - **Fallback:** Initials Avatar.
3. **Player Detail Page Header** (`/players/[key]`):
   - This detail page is shared. The header photo must dynamically adjust:
     - If accessed in the **Current Tournament** context (e.g. without historical query parameters or coming from `/players`), show the current tournament era photo.
     - If accessed in the **History** context (e.g. from `/history/players` or with historical filter parameters), show their latest global photo.

### Team Name & Logo Display
1. **Current Tournament Pages**:
   - Display the team's era-specific name (e.g., `Team Liquid PH`) and era-specific logo for the current tournament.
2. **History Pages - Season-Filtered**:
   - Display the era-correct name and logo for that specific season (e.g., `AURA PH` and the AURA logo in MSC 2021; `ECHO` and the ECHO logo in MSC 2023).
3. **History Pages - All-Time / Aggregate**:
   - Always roll up and display the stable franchise under its latest lineage name and latest logo (e.g., `Team Liquid PH` and the Team Liquid logo for the TLPH lineage).
4. **Fallback:**
   - There are no missing team era logos in the DB seed; the DB holds all required logos.

---

## 2. Route Separation & Locking

1. **Current Tournament Pages**:
   - Must be locked strictly to the live/featured tournament.
   - Use the `resolveCurrent` helper to force-set the featured `scope` and `season` (ignoring any `season` or `scope` URL parameters).
   - Only `stage` (e.g. qualifier, main) and `min_games` URL parameters are allowed.
2. **History Pages**:
   - Must be fully filterable.
   - Use the `resolveSelection` helper which honors the `FilterBar` values (`scope`, `season`, `stage`, `min_games`).
   - If no filters are chosen, default to all-time/aggregate.
