'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import MatchCard from '@/components/MatchCard';
import DayAccordion from '@/components/DayAccordion';
import type { SerializedMatch } from '@/lib/types';

export default function SchedulePage() {
  const [matches, setMatches] = useState<SerializedMatch[] | null>(null);
  const [error, setError] = useState('');
  const [openDays, setOpenDays] = useState<Set<number> | null>(null);

  async function load() {
    try {
      const data = await apiFetch<SerializedMatch[]>('/matches');
      setMatches(data);
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

  const league = matches?.filter((m) => m.stage === 'league') ?? [];
  const finals = matches?.filter((m) => m.stage === 'finals') ?? [];

  const leagueByDay = new Map<number, SerializedMatch[]>();
  for (const m of league) {
    if (!leagueByDay.has(m.day)) leagueByDay.set(m.day, []);
    leagueByDay.get(m.day)!.push(m);
  }
  const days = [...leagueByDay.keys()].sort((a, b) => a - b);

  useEffect(() => {
    if (openDays !== null || days.length === 0) return;
    const nextDay = days.find((d) => leagueByDay.get(d)!.some((m) => m.status !== 'completed'));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time default: open the next unplayed day
    setOpenDays(new Set([nextDay ?? days[days.length - 1]]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- days/leagueByDay are recomputed from matches each render; days.length is enough to gate this one-time init
  }, [days.length, openDays]);

  function toggleDay(day: number) {
    setOpenDays((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="text-[15px] font-semibold">League Stage — 16 Matches / 8 Days</h2>
          {days.length > 0 && (
            <div className="flex shrink-0 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setOpenDays(new Set(days))}
                className="rounded-full border border-border px-2.5 py-1 font-medium text-muted hover:text-foreground"
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={() => setOpenDays(new Set())}
                className="rounded-full border border-border px-2.5 py-1 font-medium text-muted hover:text-foreground"
              >
                Collapse all
              </button>
            </div>
          )}
        </div>
        <p className="mb-4 text-[13px] text-muted">Upcoming matches are shown in grey; completed ones show placements, kills and points.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && !matches && <p className="text-sm text-muted">Loading…</p>}
        {!error && matches && (
          <div className="space-y-2.5">
            {days.map((day) => (
              <DayAccordion
                key={day}
                day={day}
                matches={leagueByDay.get(day)!}
                open={openDays?.has(day) ?? false}
                onToggle={() => toggleDay(day)}
              />
            ))}
          </div>
        )}
      </section>

      {finals.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
          <h2 className="mb-3 text-[15px] font-semibold">Finals</h2>
          <div className="grid gap-2.5">
            {finals.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
