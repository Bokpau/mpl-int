# STATS RULES — Computation & Display

Canonical stats math and formatting for all MLBB stats products.
Mirrored in three places — edit all together:
`mpl-ph-s17/stats-rules.md` · `mpl-ph-s17-backend/stats-rules.md` · `mpl-intl/stats-rules.md`

Stats are computed on the backend. Frontends format and render; they never re-aggregate.
Ask BOK before changing anything in this file.

---

## 1. Aggregation principle: recompute from totals

When aggregating a stat across multiple games, **sum the raw inputs first, then apply the formula once**. Never take the mean of per-game ratio values.

**Only exception:** per-minute stats (GPM, DPM, DTPM, Turret Dmg/min) — see formula 6.

> Example: season KDA over 9 games with 45 kills, 60 assists, 20 deaths
> = (45 + 60) / 20 = **5.25**
> NOT the average of nine per-game KDA values.

---

## 2. Formulas

### 2.1 KDA
```
KDA = (Kills + Assists) / Deaths
If Deaths = 0: KDA = Kills + Assists
```
Aggregated: `(sum Kills + sum Assists) / sum Deaths` (zero-deaths rule still applies to the sums).

### 2.2 Turtle Control %
```
Turtle Control % = Turtle Kills / 3
```
Fixed denominator of 3 per game, even if fewer turtles spawned.
Aggregated: `sum Turtle Kills / (3 × games played)`.

> Example: 2 turtle kills in a game = 2/3 = **66.67%**. 10 turtles over 6 games = 10/18 = **55.56%**.

### 2.3 Lord Control %
```
Lord Control % = Lord Kills / Total Lord Kills in the Game
If Total Lord Kills = 0: Lord Control % = 0
```
Aggregated: `sum Lord Kills / sum Total Lord Kills across games` (0 if the denominator sum is 0).

### 2.4 Kill Participation (player)
```
KP = (Kills + Assists) / Total Team Kills   (the player's own team)
If Total Team Kills = 0: KP = 0
```
Aggregated: `(sum Kills + sum Assists) / sum Team Kills`.

> Example: player has 4 K, 9 A; team scored 20 kills = 13/20 = **65%** → display `65.0%`.

### 2.5 Team Kill Participation (team-level)
```
Team KP = (sum of all 5 players' Kills + Assists) / (Team Kills × 5)
If Team Kills = 0: Team KP = 0
```
Measures how involved the whole team is per kill (each kill allows up to 5 participants: 1 killer + 4 assists).
Aggregated: same formula over summed totals.

### 2.6 Per-minute stats (GPM, DPM, DTPM, Turret Dmg/min)
Aggregated value = **mean of the per-game values** (every game counts equally, regardless of game length).
This is the only stat family that averages per-game values instead of recomputing from totals.

### 2.7 Turret Destroyed %
```
Turret Destroyed % = Turret Kills / 9
```
Fixed denominator of 9 per game.
Aggregated: `sum Turret Kills / (9 × games played)`.

---

## 3. Display formatting

The stat's **category** decides its format. Precedence, highest first:

| Category | Format | Example |
|---|---|---|
| Per-minute (GPM, DPM, DTPM, Turret Dmg/min) | Whole number, no decimals | `745` |
| Percentages (all Control %, KP, Team KP, Turret Destroyed %, win rate, …) | ×100, `%` sign, up to 2 decimals, trim trailing zeros (min 1 decimal) | `72.56%`, `72.5%`, `10.0%` |
| Averages, KDA, CC time | Up to 2 decimals, trim trailing zeros (min 1 decimal) | `5.25`, `10.5`, `10.0` |
| Raw totals (total gold, total damage, total healing, kill counts, …) > 999 | No decimals | `15403` |

Decimal rules in detail:
- Max 2 decimal places. Trim a trailing zero: `10.50` → `10.5`. A whole number keeps one decimal: `10` → `10.0`.
- The ">999 drops decimals" rule applies **only to raw totals**. Percentages, averages, KDA, CC time and per-minute stats always follow their category rule regardless of magnitude.

### Time formats
- **Game time:** always `mm:ss`.
- **CC time:** the API gives milliseconds. Convert to seconds and append `s`. Follows the averages decimal rule. Example: `83417 ms` → `83.42s`.

---

## 4. Stats table structure

1. Every stats table must offer the full set of stat filter groups — **Record, Combat, Damage, Objectives, Milestones, Totals** — and each group must be present with data on every table (stable: always there, same set everywhere).
2. Every column header in a stats table must be sortable.

---

## 5. Worked reference examples

| Input | Rule | Display |
|---|---|---|
| 45 K, 60 A, 20 D (season) | KDA from totals | `5.25` |
| 12 K, 30 A, 0 D | KDA zero deaths | `42.0` |
| 2 turtle kills, 1 game | Turtle /3 | `66.67%` |
| 1 lord kill, 0 total lords other games, 1 total | Lord control | `100.0%` |
| 4 K + 9 A, team 20 kills | KP | `65.0%` |
| GPM 712, 745, 803 over 3 games | mean per-game | `753` |
| 15403 total gold | raw total >999 | `15403` |
| 83417 ms CC | ms→s + `s` | `83.42s` |
| 754 s game time | mm:ss | `12:34` |
