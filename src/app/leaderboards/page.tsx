'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import TeamBadge from '@/components/TeamBadge';
import type { PlayerDeathsRow, PlayerKillsRow, TeamDeathsRow, TeamKillsRow } from '@/lib/types';

type Stage = 'league' | 'finals' | 'all';

interface KillsResponse {
  byTeam: TeamKillsRow[];
  byPlayer: PlayerKillsRow[];
}
interface DeathsResponse {
  byTeam: TeamDeathsRow[];
  byPlayer: PlayerDeathsRow[];
}

function RankTable<T extends { teamName: string; color: TeamKillsRow['color']; playerName?: string }>({
  rows,
  valueKey,
  valueLabel,
}: {
  rows: T[];
  valueKey: 'kills' | 'deaths';
  valueLabel: string;
}) {
  if (!rows.length) return <p className="text-[13px] text-muted">No data yet.</p>;
  return (
    <div className="relative -mx-4 sm:mx-0">
    <div className="overflow-x-auto scroll-thin px-4 sm:px-0">
      <table className="w-full min-w-70 border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
            <th className="border-b border-border py-2 pr-3">#</th>
            {rows[0].playerName !== undefined && <th className="border-b border-border py-2 pr-3">Player</th>}
            <th className="border-b border-border py-2 pr-3">Team</th>
            <th className="border-b border-border py-2 pr-3">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="border-b border-border py-2 pr-3">{i + 1}</td>
              {row.playerName !== undefined && <td className="border-b border-border py-2 pr-3">{row.playerName}</td>}
              <td className="border-b border-border py-2 pr-3">
                <TeamBadge name={row.teamName} color={row.color} size="sm" />
              </td>
              <td className="border-b border-border py-2 pr-3 font-semibold">{(row as unknown as Record<string, number>)[valueKey]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-surface to-transparent sm:hidden" />
    </div>
  );
}

export default function LeaderboardsPage() {
  const [stage, setStage] = useState<Stage>('league');
  const [kills, setKills] = useState<KillsResponse | null>(null);
  const [deaths, setDeaths] = useState<DeathsResponse | null>(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const [k, d] = await Promise.all([
        apiFetch<KillsResponse>(`/leaderboard/kills?stage=${stage}`),
        apiFetch<DeathsResponse>(`/leaderboard/deaths?stage=${stage}`),
      ]);
      setKills(k);
      setDeaths(d);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll, re-runs when stage changes
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-[13px] text-muted" htmlFor="stage-select">
          Stage:
        </label>
        <select
          id="stage-select"
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage)}
          className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[13px]"
        >
          <option value="league">League</option>
          <option value="finals">Finals</option>
          <option value="all">All</option>
        </select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-semibold">Most Kills — Teams</h2>
          {kills ? <RankTable rows={kills.byTeam} valueKey="kills" valueLabel="Kills" /> : <p className="text-sm text-muted">Loading…</p>}
        </section>
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-semibold">Most Kills — Players</h2>
          {kills ? <RankTable rows={kills.byPlayer} valueKey="kills" valueLabel="Kills" /> : <p className="text-sm text-muted">Loading…</p>}
        </section>
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-semibold">Most Deaths — Teams</h2>
          {deaths ? <RankTable rows={deaths.byTeam} valueKey="deaths" valueLabel="Deaths" /> : <p className="text-sm text-muted">Loading…</p>}
        </section>
        <section className="rounded-2xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-[15px] font-semibold">Most Deaths — Players</h2>
          {deaths ? <RankTable rows={deaths.byPlayer} valueKey="deaths" valueLabel="Deaths" /> : <p className="text-sm text-muted">Loading…</p>}
        </section>
      </div>
    </div>
  );
}
