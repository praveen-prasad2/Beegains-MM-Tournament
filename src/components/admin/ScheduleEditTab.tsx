'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { SerializedMatch, Team } from '@/lib/types';

interface RowState {
  day: number;
  matchNumber: number;
  teamIds: [number, number, number];
  date: string;
  notes: string;
  msg: { text: string; ok: boolean } | null;
  saving: boolean;
}

export default function ScheduleEditTab({ teams }: { teams: Team[] }) {
  const [matches, setMatches] = useState<SerializedMatch[]>([]);
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<SerializedMatch[]>('/matches?stage=league').then((list) => {
      const sorted = list.slice().sort((a, b) => a.day - b.day || a.matchNumber - b.matchNumber);
      setMatches(sorted);
      const initial: Record<number, RowState> = {};
      for (const m of sorted) {
        initial[m.id] = {
          day: m.day,
          matchNumber: m.matchNumber,
          teamIds: m.teams.map((t) => t.teamId) as [number, number, number],
          date: m.date ?? '',
          notes: m.notes ?? '',
          msg: null,
          saving: false,
        };
      }
      setRows(initial);
      setLoading(false);
    });
  }, []);

  function updateRow(id: number, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  async function saveRow(id: number) {
    const row = rows[id];
    if (new Set(row.teamIds).size !== 3) {
      updateRow(id, { msg: { text: 'Please select 3 different teams.', ok: false } });
      return;
    }
    updateRow(id, { saving: true, msg: null });
    try {
      await apiFetch(`/admin/matches/${id}/schedule`, {
        method: 'PUT',
        body: JSON.stringify({ day: row.day, matchNumber: row.matchNumber, teamIds: row.teamIds, date: row.date || null, notes: row.notes }),
      });
      updateRow(id, { saving: false, msg: { text: 'Saved.', ok: true } });
    } catch (err) {
      updateRow(id, { saving: false, msg: { text: err instanceof Error ? err.message : 'Failed to save', ok: false } });
    }
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 className="mb-1 text-[15px] font-semibold">League Schedule</h2>
      <p className="mb-4 text-[13px] text-muted">
        Edit the day, match slot, competing teams, date or notes for any league match. Useful for reschedules.
      </p>

      <div className="space-y-3">
        {matches.map((m) => {
          const row = rows[m.id];
          if (!row) return null;
          return (
            <div key={m.id} className="rounded-xl border border-border bg-surface-2 p-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[11px] text-muted">Day</label>
                  <input
                    type="number"
                    min={1}
                    value={row.day}
                    onChange={(e) => updateRow(m.id, { day: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-muted">Match #</label>
                  <input
                    type="number"
                    min={1}
                    value={row.matchNumber}
                    onChange={(e) => updateRow(m.id, { matchNumber: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                  />
                </div>
              </div>

              <label className="mb-1 mt-2.5 block text-[11px] text-muted">Teams</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[0, 1, 2].map((slot) => (
                  <select
                    key={slot}
                    value={row.teamIds[slot]}
                    onChange={(e) => {
                      const next = [...row.teamIds] as [number, number, number];
                      next[slot] = Number(e.target.value);
                      updateRow(m.id, { teamIds: next });
                    }}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                ))}
              </div>

              <label className="mb-1 mt-2.5 block text-[11px] text-muted">Date</label>
              <input
                type="date"
                value={row.date}
                onChange={(e) => updateRow(m.id, { date: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
              />

              <label className="mb-1 mt-2.5 block text-[11px] text-muted">Notes</label>
              <input
                type="text"
                value={row.notes}
                onChange={(e) => updateRow(m.id, { notes: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm"
              />

              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => saveRow(m.id)}
                  disabled={row.saving}
                  className="rounded-lg border border-border bg-surface px-3.5 py-1.5 text-[13px] font-semibold disabled:opacity-50"
                >
                  {row.saving ? 'Saving…' : 'Save Changes'}
                </button>
                {row.msg && <span className={`text-[12.5px] ${row.msg.ok ? 'text-success' : 'text-danger'}`}>{row.msg.text}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
