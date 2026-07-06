// Jungle camp positions (render data only).
//
// This file is shipped to the browser, so it holds ONLY the static camp data
// needed to draw markers on the map. The creep-kill DETECTION ALGORITHM is
// intentionally NOT here — it lives on the backend (mpl-ph-s17-backend/
// jungleDetect.js) and is reached via GET /api/matches/:battleId/jungle-state,
// which returns the per-camp clear timeline. Keeping the algorithm server-side
// keeps it out of the client bundle. See jungle-creeps-logic.md.
//
// Coordinates are RAW API x/y (same space as match_realtime_snapshots.map_pos_x
// / map_pos_y, roughly -37.5..37.5), taken from BOK's reference sheet. Each camp
// exists on both sides (red is the mirror of blue). To draw on the rotated
// minimap, pass these through apiToMap() the same way combat positions are.
//
// `creeps` is how many monsters share the camp; a 2-creep camp (Purple Buff,
// Fire Beetle) only disappears once both die. `firstSpawn` / `respawn` (seconds,
// from BOK's sheet) drive the render layer's first-appearance and respawn
// countdowns. Fire Beetle swaps in place to a small beetle after both die
// (handled at render). None of these are the detection algorithm — that is
// server-side; these are only used to draw the live camp state.
//
// Crabs: the two mirror spots are one Gold Crab + one EXP Crab per game (which is
// which varies). EXP Crab gives EXP only (no gold) so the detector can't see it;
// only the Gold Crab gets clears. The render layer shows the crab side that
// actually received clears. (EXP Crab is not modelled yet.)

export const JUNGLE_CAMPS = [
  // name,            side,   x,       y,      firstSpawn, respawn, buff,                          creeps
  camp('Purple Buff', 'blue', -13.83, 11.10, 25, 90, 'CDR / mana & energy cost', 2),
  camp('Purple Buff', 'red', 13.83, -11.10, 25, 90, 'CDR / mana & energy cost', 2),
  camp('Orange Buff', 'blue', -18.10, -13.90, 25, 90, 'True damage + slow on attack', 1),
  camp('Orange Buff', 'red', 18.10, 13.90, 25, 90, 'True damage + slow on attack', 1),
  camp('Horned Lizard', 'blue', -14.10, 21.20, 25, 70, 'HP & mana regen', 1),
  camp('Horned Lizard', 'red', 14.10, -21.20, 25, 70, 'HP & mana regen', 1),
  camp('Lava Golem', 'blue', -10.90, -12.00, 25, 70, 'HP & mana regen', 1),
  camp('Lava Golem', 'red', 10.90, 12.00, 25, 70, 'HP & mana regen', 1),
  camp('Fire Beetle', 'blue', -10.80, -23.60, 25, 70, 'HP & mana regen', 2),
  camp('Fire Beetle', 'red', 11.06, 23.50, 25, 70, 'HP & mana regen', 2),
  // Lithowanderer is NOT here — it's a Lord/Turtle-like contested objective shown
  // in the events timeline (ground-truth kill_crab_times), not on the map.
  camp('Gold Crab', 'blue', -3.82, 29.78, 42, 45, 'Bonus gold over time', 1),
  camp('Gold Crab', 'red', 3.76, -29.90, 42, 45, 'Bonus gold over time', 1),
];

function camp(name, side, x, y, firstSpawn, respawn, buff, creeps = 1) {
  return { name, side, x, y, firstSpawn, respawn, buff, creeps, id: `${name}_${side}` };
}
