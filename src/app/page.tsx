'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import TeamBadge from '@/components/TeamBadge';
import type { LeagueState, PointsTableRow } from '@/lib/types';

const RANK_STYLES: Record<number, string> = {
  1: 'bg-gradient-to-br from-[#ffd76a] to-[#b8860b] text-[#3a2a00]',
  2: 'bg-gradient-to-br from-[#e2e8f0] to-[#94a3b8] text-[#1f2937]',
  3: 'bg-gradient-to-br from-[#f0b27a] to-[#a15c2a] text-[#3a1f00]',
};

export default function PointsTablePage() {
  const [table, setTable] = useState<PointsTableRow[] | null>(null);
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await apiFetch<{ table: PointsTableRow[]; league: LeagueState }>('/points-table');
      setTable(data.table);
      setLeague(data.league);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount + poll
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const started = table?.some((r) => r.matchesPlayed > 0);

  return (
    <div className="space-y-4">
      {league?.complete && table && (
        <div className="rounded-xl border border-dashed border-success/50 bg-success/10 px-4 py-3 text-[13px] text-success">
          🏆 League stage complete — Finals Zone qualifiers:{' '}
          {table
            .filter((r) => league.qualifiedTeamIds.includes(r.teamId))
            .map((r) => r.teamName)
            .join(', ')}
        </div>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">League Points Table</h2>
        </div>
        <p className="mb-4 text-[13px] text-muted">
          Top 3 teams qualify for the Finals once the league stage is marked complete.
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}

        {!error && !table && <p className="text-sm text-muted">Loading…</p>}

        {!error && table && !started && (
          <p className="text-sm text-muted">No league matches played yet. Check the Schedule tab for upcoming fixtures.</p>
        )}

        {!error && table && started && (
          <div className="relative -mx-4 sm:mx-0">
          <div className="overflow-x-auto scroll-thin px-4 sm:px-0">
            <table className="w-full min-w-140 border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="border-b border-border py-2 pr-3">#</th>
                  <th className="border-b border-border py-2 pr-3">Team</th>
                  <th className="border-b border-border py-2 pr-3">MP</th>
                  <th className="border-b border-border py-2 pr-3">1st</th>
                  <th className="border-b border-border py-2 pr-3">2nd</th>
                  <th className="border-b border-border py-2 pr-3">3rd</th>
                  <th className="border-b border-border py-2 pr-3">Kills</th>
                  <th className="border-b border-border py-2 pr-3">Points</th>
                </tr>
              </thead>
              <tbody>
                {table.map((row, idx) => {
                  const qualified = idx < 3;
                  return (
                    <tr
                      key={row.teamId}
                      className={`${qualified ? 'shadow-[inset_3px_0_0_var(--success)]' : ''}`}
                    >
                      <td className="border-b border-border py-2.5 pr-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                            RANK_STYLES[row.rank] ?? 'bg-surface-2 text-muted'
                          }`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="border-b border-border py-2.5 pr-3">
                        <TeamBadge name={row.teamName} color={row.color} />
                      </td>
                      <td className="border-b border-border py-2.5 pr-3">{row.matchesPlayed}</td>
                      <td className="border-b border-border py-2.5 pr-3">{row.firsts}</td>
                      <td className="border-b border-border py-2.5 pr-3">{row.seconds}</td>
                      <td className="border-b border-border py-2.5 pr-3">{row.thirds}</td>
                      <td className="border-b border-border py-2.5 pr-3">{row.totalKills}</td>
                      <td className="border-b border-border py-2.5 pr-3 font-semibold text-foreground">{row.totalPoints}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-surface to-transparent sm:hidden" />
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted">Standings update automatically as match results are entered.</p>
    </div>
  );
}
