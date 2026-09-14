'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, ordinal } from '@/lib/api-client';
import TeamBadge from '@/components/TeamBadge';
import type { AuditEntry, SerializedMatch, Team } from '@/lib/types';

type PlacementMap = Record<number, '' | 1 | 2 | 3>;
type PlayerStatMap = Record<number, { kills: number; deaths: number }>;

export default function ResultEntryTab({ teams }: { teams: Team[] }) {
  const [matches, setMatches] = useState<SerializedMatch[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [match, setMatch] = useState<SerializedMatch | null>(null);
  const [placements, setPlacements] = useState<PlacementMap>({});
  const [playerStats, setPlayerStats] = useState<PlayerStatMap>({});
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<AuditEntry[] | null>(null);

  async function loadMatches(preselect?: number) {
    const list = await apiFetch<SerializedMatch[]>('/matches');
    setMatches(list);
    if (preselect) {
      setSelectedId(preselect);
      return;
    }
    const league = list.filter((m) => m.stage === 'league');
    const nextUp = league.find((m) => m.status !== 'completed') || league[0];
    if (nextUp) setSelectedId(nextUp.id);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch-on-mount
    loadMatches();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset transient UI state when the selected match changes
    setHistory(null);
    setMsg(null);
    apiFetch<SerializedMatch>(`/matches/${selectedId}`).then((m) => {
      setMatch(m);
      const p: PlacementMap = {};
      const s: PlayerStatMap = {};
      for (const mt of m.teams) p[mt.teamId] = mt.placement ?? '';
      for (const ps of m.players) s[ps.playerId] = { kills: ps.kills, deaths: ps.deaths };
      // Default any un-set player (new/edited match) to 0 kills / 1 death.
      for (const mt of m.teams) {
        const team = teams.find((t) => t.id === mt.teamId);
        team?.players.forEach((pl) => {
          if (!s[pl.id]) s[pl.id] = { kills: 0, deaths: 1 };
        });
      }
      setPlacements(p);
      setPlayerStats(s);
      setDate(m.date ?? '');
      setNotes(m.notes ?? '');
    });
  }, [selectedId, teams]);

  const usedPlacements = useMemo(() => new Set(Object.values(placements).filter(Boolean)), [placements]);

  async function handleSubmit() {
    if (!match) return;
    setMsg(null);
    const teamEntries = match.teams.map((mt) => ({ teamId: mt.teamId, placement: placements[mt.teamId] }));
    if (teamEntries.some((t) => !t.placement)) {
      setMsg({ text: 'Please set a placement (1st/2nd/3rd) for all 3 teams.', ok: false });
      return;
    }
    const players = Object.entries(playerStats).map(([playerId, stat]) => ({
      playerId: Number(playerId),
      kills: stat.kills,
      deaths: stat.deaths,
    }));

    setSaving(true);
    try {
      await apiFetch(`/admin/matches/${match.id}/result`, {
        method: 'POST',
        body: JSON.stringify({ teams: teamEntries, players, date: date || null, notes }),
      });
      setMsg({ text: 'Saved. Points table and leaderboards updated.', ok: true });
      await loadMatches(match.id);
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : 'Failed to save', ok: false });
    } finally {
      setSaving(false);
    }
  }

  async function loadHistory() {
    if (!match) return;
    const h = await apiFetch<AuditEntry[]>(`/admin/matches/${match.id}/audit`);
    setHistory(h.slice().reverse());
  }

  const league = matches.filter((m) => m.stage === 'league');
  const finals = matches.filter((m) => m.stage === 'finals');

  function optionLabel(m: SerializedMatch) {
    const label = m.stage === 'league' ? `Day ${m.day} · Match ${m.matchNumber}` : `Finals · Match ${m.matchNumber}`;
    const teamsStr = m.teams.map((t) => t.teamName).join(' vs ');
    return `${label} — ${teamsStr}${m.status === 'completed' ? ' ✓' : ''}`;
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="mb-3 text-[15px] font-semibold">Enter / Edit Match Result</h2>

      <label className="mb-1 block text-[12.5px] text-muted" htmlFor="match-select">
        Match
      </label>
      <select
        id="match-select"
        value={selectedId ?? ''}
        onChange={(e) => setSelectedId(Number(e.target.value))}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent-2"
      >
        <optgroup label="League">
          {league.map((m) => (
            <option key={m.id} value={m.id}>
              {optionLabel(m)}
            </option>
          ))}
        </optgroup>
        {finals.length > 0 && (
          <optgroup label="Finals">
            {finals.map((m) => (
              <option key={m.id} value={m.id}>
                {optionLabel(m)}
              </option>
            ))}
          </optgroup>
        )}
      </select>

      {match && (
        <div className="mt-4 space-y-3">
          {match.teams.map((mt) => {
            const team = teams.find((t) => t.id === mt.teamId);
            if (!team) return null;
            return (
              <div key={mt.teamId} className="rounded-xl border border-border bg-surface-2 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <TeamBadge name={team.name} color={team.color} size="lg" />
                  <select
                    value={placements[mt.teamId] ?? ''}
                    onChange={(e) =>
                      setPlacements((prev) => ({ ...prev, [mt.teamId]: (e.target.value ? Number(e.target.value) : '') as never }))
                    }
                    className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[13px]"
                  >
                    <option value="">Placement</option>
                    {[1, 2, 3].map((p) => (
                      <option key={p} value={p} disabled={usedPlacements.has(p as 1 | 2 | 3) && placements[mt.teamId] !== p}>
                        {ordinal(p)} ({p === 1 ? 10 : p === 2 ? 5 : 3} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 grid grid-cols-[1fr_64px_64px] gap-2 text-[11px] text-muted">
                  <span>Player</span>
                  <span>Kills</span>
                  <span>Deaths</span>
                </div>
                {team.players.map((p) => (
                  <div key={p.id} className="mt-1.5 grid grid-cols-[1fr_64px_64px] items-center gap-2">
                    <span className="truncate text-[13px]">{p.name}</span>
                    <input
                      type="number"
                      min={0}
                      value={playerStats[p.id]?.kills ?? 0}
                      onChange={(e) =>
                        setPlayerStats((prev) => ({
                          ...prev,
                          [p.id]: { kills: Math.max(0, Number(e.target.value) || 0), deaths: prev[p.id]?.deaths ?? 1 },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      value={playerStats[p.id]?.deaths ?? 1}
                      onChange={(e) =>
                        setPlayerStats((prev) => ({
                          ...prev,
                          [p.id]: { kills: prev[p.id]?.kills ?? 0, deaths: Math.max(0, Number(e.target.value) || 0) },
                        }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                ))}
              </div>
            );
          })}

          <div>
            <label className="mb-1 block text-[12.5px] text-muted" htmlFor="match-date">
              Date
            </label>
            <input
              id="match-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[12.5px] text-muted" htmlFor="match-notes">
              Notes (optional)
            </label>
            <textarea
              id="match-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-[#16181f] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Result & Calculate Points'}
            </button>
            {match.status === 'completed' && (
              <button
                onClick={loadHistory}
                className="rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold"
              >
                View Edit History
              </button>
            )}
          </div>

          {msg && <p className={`text-[13px] ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}

          {history && (
            <div className="space-y-2 pt-1">
              {history.length === 0 && <p className="text-[13px] text-muted">No prior edits recorded.</p>}
              {history.map((h) => (
                <div key={h.id} className="rounded-lg border border-border bg-surface-2 p-2.5">
                  <div className="text-[11px] text-muted">{new Date(h.timestamp).toLocaleString()}</div>
                  <div className="text-[12px]">
                    {h.after.teams.map((t) => `${teams.find((tm) => tm.id === t.teamId)?.name ?? t.teamId}: ${ordinal(t.placement ?? 0)}, ${t.kills}k, ${t.points}pts`).join(' · ')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
