// Display helpers. The intl API returns numeric aggregates as strings (pg numeric),
// so coerce before formatting.
export const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const int = (v) => num(v).toLocaleString('en-US');

export const dec = (v, d = 2) => num(v).toFixed(d);

// Win-rate / KDA cell coloring thresholds.
export const wrClass = (v) => (num(v) >= 50 ? 'pos' : 'neg');

export const pct = (v) => `${dec(v, 1)}%`;
