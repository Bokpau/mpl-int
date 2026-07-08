import { api } from '../../lib/api';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import StatTable from '../StatTable';
import StatLegend from '../StatLegend';
import { TEAM_COLUMNS as COLUMNS, STAT_GROUPS } from '../../lib/columns';
import { teamFieldKeys, identityMode } from '../../lib/identity';
import standingsData from '../../lib/data/international_standings.json';

// Team leaderboard for one selection. Selection-agnostic — the caller resolves `q`/`label`.
export default async function TeamStatsView({ q, label, eff, context = 'current' }) {
  let rows = null;
  let error = null;
  try {
    rows = await api.teams(q);
  } catch (e) {
    error = e.message;
  }

  // Era code/name for Current + season-filtered; franchise for all-time aggregate.
  const keys = teamFieldKeys(identityMode(context, eff), 'team');
  let configuredColumns = COLUMNS.map(c =>
    c.key === 'team' ? { ...c, ...keys, query: { context } } : c
  );

  if (rows && rows.length && eff.season) {
    const currentStandings = standingsData.find(e => e.leagueCode === eff.season)?.standings || [];
    const findStanding = (team) => {
      if (!currentStandings.length) return null;
      if (team.team_key) {
        const match = currentStandings.find(s => s.teamKey === team.team_key);
        if (match) return match;
      }
      const codes = [team.team_code, team.team_code_era].filter(Boolean);
      for (const c of codes) {
        const match = currentStandings.find(s => s.teamCode?.toUpperCase() === c.toUpperCase());
        if (match) return match;
      }
      const names = [team.team_name, team.team_name_era].filter(Boolean);
      for (const n of names) {
        const match = currentStandings.find(s => s.teamName?.toUpperCase() === n.toUpperCase());
        if (match) return match;
      }
      return null;
    };

    rows = rows.map(t => {
      const standing = findStanding(t);
      return {
        ...t,
        rank: standing ? Number(standing.rank) : 999,
        placement: standing ? standing.placement : null,
      };
    }).sort((a, b) => {
      if (a.rank !== 999 || b.rank !== 999) {
        return a.rank - b.rank;
      }
      return (Number(b.win_rate) || 0) - (Number(a.win_rate) || 0);
    });

    // Dynamically insert the placement column
    const teamIdx = configuredColumns.findIndex(c => c.key === 'team');
    if (teamIdx >= 0) {
      configuredColumns.splice(teamIdx + 1, 0, {
        key: 'placement',
        label: 'Place',
        type: 'text',
        cls: 'accent',
        title: 'Tournament placement'
      });
    }
  }

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Teams">
        Team records grouped by stable franchise — rename- and rebrand-proof.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No teams for this selection.</div>
      ) : (
        <StatTable
          columns={configuredColumns}
          groups={STAT_GROUPS}
          rows={rows}
          rowKey="team_key"
          rowHref={{ base: '/teams/', key: 'team_key', query: { context } }}
          defaultLimit={20}
        />
      )}

      {rows && rows.length > 0 ? <StatLegend keys={['Win%', 'KDA', 'GPM', 'DPM', 'Editions']} /> : null}
    </div>
  );
}
