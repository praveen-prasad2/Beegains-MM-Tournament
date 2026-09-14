'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { apiFetch, ordinal } from '@/lib/api-client';
import TeamLogo from '@/components/TeamLogo';
import MatchCard from '@/components/MatchCard';
import { RANK_GRADIENT } from '@/lib/rank';
import type { LeagueState, SerializedMatch, Team } from '@/lib/types';

export default function FinalsPage() {
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [matches, setMatches] = useState<SerializedMatch[] | null>(null);
  const [error, setError] = useState('');

  async function load() {
    try {
      const leagueState = await apiFetch<LeagueState>('/league-state');
      setLeague(leagueState);
      if (leagueState.complete) {
        const [teamList, matchList] = await Promise.all([
          apiFetch<Team[]>('/teams'),
          apiFetch<SerializedMatch[]>('/matches?stage=finals'),
        ]);
        setTeams(teamList);
        setMatches(matchList);
      }
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

  if (error) return <p className="text-sm text-danger">{error}</p>;
  if (!league) return <p className="text-sm text-muted">Loading…</p>;

  if (!league.complete) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-5 text-center">
        <Trophy className="mx-auto mb-3 text-muted" size={28} strokeWidth={1.75} />
        <h2 className="mb-2 text-[15px] font-semibold">Finals not started yet</h2>
        <p className="text-[13px] text-muted">
          The Finals will appear here once the league stage is complete and the top 3 teams have been determined.
        </p>
      </section>
    );
  }

  const qualified = league.qualifiedTeamIds.map((id) => teams?.find((t) => t.id === id)).filter(Boolean) as Team[];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-4 flex items-center gap-2 text-[15px] font-semibold">
          <Trophy size={17} className="text-accent" strokeWidth={2} />
          Qualified Teams
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {qualified.map((t, i) => (
            <div
              key={t.id}
              className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-4 py-5 text-center"
            >
              <TeamLogo name={t.name} color={t.color} size="xl" />
              <span className="text-sm font-semibold">{t.name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${RANK_GRADIENT[i + 1]}`}>
                {ordinal(i + 1)} Place
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-3 text-[15px] font-semibold">Finals Matches</h2>
        {!matches?.length && <p className="text-[13px] text-muted">No Finals matches have been entered yet.</p>}
        <div className="grid gap-2.5">
          {matches?.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
