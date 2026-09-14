'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ordinal } from '@/lib/api-client';
import TeamBadge from '@/components/TeamBadge';
import type { LeagueState, SerializedMatch, Team } from '@/lib/types';

export default function LeagueFinalsTab({ teams }: { teams: Team[] }) {
  const [league, setLeague] = useState<LeagueState | null>(null);
  const [matches, setMatches] = useState<SerializedMatch[]>([]);
  const [leagueMsg, setLeagueMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [finalsMsg, setFinalsMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const [l, m] = await Promise.all([apiFetch<LeagueState>('/league-state'), apiFetch<SerializedMatch[]>('/matches')]);
    setLeague(l);
    setMatches(m);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    load();
  }, []);

  const leagueMatches = matches.filter((m) => m.stage === 'league');
  const completedCount = leagueMatches.filter((m) => m.status === 'completed').length;
  const finalsMatches = matches.filter((m) => m.stage === 'finals');

  async function completeLeague(force = false) {
    setBusy(true);
    setLeagueMsg(null);
    try {
      await apiFetch('/admin/league/complete', { method: 'POST', body: JSON.stringify({ force }) });
      setLeagueMsg({ text: `League marked complete${force ? ' (forced)' : ''}. Top 3 teams qualified for Finals.`, ok: true });
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed';
      if (message.includes('Not all league') && !force) {
        if (confirm('Not all league matches are completed yet. Mark complete anyway?')) {
          await completeLeague(true);
          return;
        }
      }
      setLeagueMsg({ text: message, ok: false });
    } finally {
      setBusy(false);
    }
  }

  async function reopenLeague() {
    if (!confirm('Reopen the league stage? Finals qualification will be cleared.')) return;
    await apiFetch('/admin/league/reopen', { method: 'POST' });
    await load();
  }

  async function addFinalsMatch() {
    setFinalsMsg(null);
    try {
      await apiFetch('/admin/finals/matches', { method: 'POST', body: JSON.stringify({}) });
      setFinalsMsg({ text: 'Finals match added.', ok: true });
      await load();
    } catch (err) {
      setFinalsMsg({ text: err instanceof Error ? err.message : 'Failed to add match', ok: false });
    }
  }

  async function removeFinalsMatch(id: number) {
    await apiFetch(`/admin/finals/matches/${id}`, { method: 'DELETE' });
    await load();
  }

  if (!league) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-2 text-[15px] font-semibold">League Stage</h2>
        <p className="mb-3 text-[13px] text-muted">
          {league.complete
            ? `League stage is COMPLETE. ${completedCount}/${leagueMatches.length} matches recorded.`
            : `League stage in progress: ${completedCount}/${leagueMatches.length} matches completed.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => completeLeague(false)}
            disabled={busy || league.complete}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#16181f] disabled:opacity-50"
          >
            Mark League Complete
          </button>
          <button
            onClick={reopenLeague}
            disabled={!league.complete}
            className="rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            Reopen League Stage
          </button>
        </div>
        {leagueMsg && <p className={`mt-2 text-[13px] ${leagueMsg.ok ? 'text-success' : 'text-danger'}`}>{leagueMsg.text}</p>}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-3 text-[15px] font-semibold">Finals</h2>
        {league.complete ? (
          <div className="space-y-2">
            {league.qualifiedTeamIds.map((id, i) => {
              const team = teams.find((t) => t.id === id);
              if (!team) return null;
              return (
                <div key={id} className="flex items-center justify-between">
                  <TeamBadge name={team.name} color={team.color} />
                  <span className="text-[12px] text-muted">Qualified {ordinal(i + 1)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] text-muted">League stage not complete yet.</p>
        )}

        <div className="mt-3">
          <button
            onClick={addFinalsMatch}
            disabled={!league.complete}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#16181f] disabled:opacity-50"
          >
            + Add Finals Match
          </button>
        </div>
        {finalsMsg && <p className={`mt-2 text-[13px] ${finalsMsg.ok ? 'text-success' : 'text-danger'}`}>{finalsMsg.text}</p>}

        <hr className="my-3.5 border-border" />

        <div className="space-y-2">
          {finalsMatches.length === 0 && <p className="text-[13px] text-muted">No Finals matches yet.</p>}
          {finalsMatches.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <span className="text-[13px]">
                Finals Match {m.matchNumber}: {m.teams.map((t) => t.teamName).join(' vs ')} {m.status === 'completed' ? '✓' : ''}
              </span>
              {m.status !== 'completed' && (
                <button
                  onClick={() => removeFinalsMatch(m.id)}
                  className="shrink-0 rounded-lg border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
