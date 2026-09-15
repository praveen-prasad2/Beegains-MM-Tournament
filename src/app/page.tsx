'use client';

import { useEffect, useState } from 'react';
import { Trophy, Crown } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import TeamBadge from '@/components/TeamBadge';
import { RANK_GRADIENT } from '@/lib/rank';
import type { LeagueState, PointsTableRow } from '@/lib/types';

// Faint tint echoing the rank badge's gold/silver/bronze, used behind top-3 rows/cards.
const RANK_ROW_TINT: Record<number, string> = {
  1: 'bg-[#ffd76a]/[0.07]',
  2: 'bg-[#e2e8f0]/[0.05]',
  3: 'bg-[#f0b27a]/[0.06]',
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
        <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-success/50 bg-success/10 px-4 py-3 text-[13px] text-success">
          <Trophy size={16} className="mt-0.5 shrink-0" strokeWidth={2} />
          <span>
            League stage complete — Finals Zone qualifiers:{' '}
            {table
              .filter((r) => league.qualifiedTeamIds.includes(r.teamId))
              .map((r) => r.teamName)
              .join(', ')}
          </span>
        </div>
      )}

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">League Points Table</h2>
          {!league?.complete && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
              </span>
              Live
            </span>
          )}
        </div>
        <p className="mb-4 text-[13px] text-muted">
          Top 3 teams qualify for the Finals once the league stage is marked complete. Ties on points are broken by fewest deaths.
        </p>

        {error && <p className="text-sm text-danger">{error}</p>}

        {!error && !table && <p className="text-sm text-muted">Loading…</p>}

        {!error && table && !started && (
          <p className="text-sm text-muted">No league matches played yet. Check the Schedule tab for upcoming fixtures.</p>
        )}

        {!error && table && started && (
          <>
            {/* Mobile: stacked cards (no horizontal scrolling needed) */}
            <div className="space-y-2 sm:hidden">
              {table.map((row, idx) => {
                const qualified = idx < 3;
                return (
                  <div
                    key={row.teamId}
                    className={`rounded-xl border p-3.5 ${
                      qualified ? 'border-success/40' : 'border-border'
                    } ${RANK_ROW_TINT[row.rank] ?? 'bg-surface-2'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                            RANK_GRADIENT[row.rank] ?? 'bg-surface text-muted'
                          }`}
                        >
                          {row.rank}
                        </span>
                        {row.rank === 1 && <Crown size={14} className="shrink-0 text-accent" strokeWidth={2} />}
                        <TeamBadge name={row.teamName} color={row.color} variant="logo" />
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-lg leading-none font-bold text-accent">{row.totalPoints}</div>
                        <div className="text-[9px] tracking-wide text-muted uppercase">pts</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-6 gap-1">
                      {[
                        ['MP', row.matchesPlayed],
                        ['1st', row.firsts],
                        ['2nd', row.seconds],
                        ['3rd', row.thirds],
                        ['Kills', row.totalKills],
                        ['Deaths', row.totalDeaths],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-surface/70 py-1.5 text-center">
                          <div className="text-[12px] font-semibold text-foreground">{value}</div>
                          <div className="text-[8px] tracking-wide text-muted uppercase">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop: full table */}
            <div className="hidden sm:block">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-[10px] tracking-wide text-muted/70 uppercase">
                    <th className="py-1" colSpan={2} />
                    <th className="py-1 text-center" />
                    <th className="border-l border-border/40 py-1 text-center" colSpan={3}>
                      Placements
                    </th>
                    <th className="border-l border-border/40 py-1 text-center" colSpan={2}>
                      Combat
                    </th>
                    <th className="border-l border-border/40 py-1" />
                  </tr>
                  <tr className="text-left text-[11px] tracking-wide text-muted uppercase">
                    <th className="border-b border-border py-2 pr-3">#</th>
                    <th className="border-b border-border py-2 pr-3">Team</th>
                    <th className="border-b border-border py-2 pr-3 text-center">MP</th>
                    <th className="border-b border-border border-l border-border/40 py-2 pr-3 text-center">1st</th>
                    <th className="border-b border-border py-2 pr-3 text-center">2nd</th>
                    <th className="border-b border-border py-2 pr-3 text-center">3rd</th>
                    <th className="border-b border-border border-l border-border/40 py-2 pr-3 text-center">Kills</th>
                    <th className="border-b border-border py-2 pr-3 text-center">Deaths</th>
                    <th className="border-b border-border border-l border-border/40 py-2 pr-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((row, idx) => {
                    const qualified = idx < 3;
                    return (
                      <tr
                        key={row.teamId}
                        className={`transition-colors hover:bg-surface-2/70 ${
                          RANK_ROW_TINT[row.rank] ?? (idx % 2 === 1 ? 'bg-surface-2/30' : '')
                        } ${qualified ? 'shadow-[inset_3px_0_0_var(--success)]' : ''}`}
                      >
                        <td className="border-b border-border py-2.5 pr-3">
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                              RANK_GRADIENT[row.rank] ?? 'bg-surface-2 text-muted'
                            }`}
                          >
                            {row.rank}
                          </span>
                        </td>
                        <td className="border-b border-border py-2.5 pr-3">
                          <span className="flex items-center gap-1.5">
                            {row.rank === 1 && <Crown size={14} className="shrink-0 text-accent" strokeWidth={2} />}
                            <TeamBadge name={row.teamName} color={row.color} variant="logo" />
                          </span>
                        </td>
                        <td className="border-b border-border py-2.5 pr-3 text-center">{row.matchesPlayed}</td>
                        <td className="border-b border-border border-l border-border/40 py-2.5 pr-3 text-center">{row.firsts}</td>
                        <td className="border-b border-border py-2.5 pr-3 text-center">{row.seconds}</td>
                        <td className="border-b border-border py-2.5 pr-3 text-center">{row.thirds}</td>
                        <td className="border-b border-border border-l border-border/40 py-2.5 pr-3 text-center">{row.totalKills}</td>
                        <td className="border-b border-border py-2.5 pr-3 text-center">{row.totalDeaths}</td>
                        <td className="border-b border-border border-l border-border/40 py-2.5 pr-3 text-right">
                          <span className="inline-block rounded-md bg-accent/10 px-2 py-0.5 font-bold text-accent">
                            {row.totalPoints}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <p className="text-center text-xs text-muted">Standings update automatically as match results are entered.</p>
    </div>
  );
}
