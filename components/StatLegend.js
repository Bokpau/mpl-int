// Collapsible glossary so the abbreviated stat columns are self-explanatory.
// Pass the subset of keys relevant to the page.
const DEFS = {
  'Win%': 'Win rate — games won ÷ games played.',
  KDA: '(Kills + Assists) ÷ Deaths.',
  'KP%': 'Kill participation — share of team kills a player took part in.',
  GPM: 'Gold per minute.',
  DPM: 'Damage per minute.',
  MVPs: 'Most Valuable Player awards.',
  Picks: 'Times the hero was picked.',
  Editions: 'Distinct international editions played.',
};

export default function StatLegend({ keys = Object.keys(DEFS) }) {
  const items = keys.filter((k) => DEFS[k]);
  if (items.length === 0) return null;
  return (
    <details className="legend">
      <summary>What do these stats mean?</summary>
      <dl>
        {items.map((k) => (
          <div className="legend-item" key={k}>
            <dt>{k}</dt>
            <dd>{DEFS[k]}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
