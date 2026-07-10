// Display helpers. The intl API returns numeric aggregates as strings (pg numeric),
// so coerce before formatting.
export const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const int = (v) => num(v).toLocaleString('en-US');

// Up to `d` decimals, trailing zeros trimmed, minimum 1 decimal (stats-rules.md §3).
export const dec = (v, d = 2) => {
  let f = num(v).toFixed(d);
  if (d >= 2 && f.includes('.')) {
    f = f.replace(/0+$/, '');
    if (f.endsWith('.')) f += '0';
  }
  return f;
};

// Win-rate / KDA cell coloring thresholds.
export const wrClass = (v) => (num(v) >= 50 ? 'pos' : 'neg');

export const pct = (v) => `${dec(v, 2)}%`;
