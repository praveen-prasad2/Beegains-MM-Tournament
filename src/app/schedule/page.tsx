'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import MatchCard from '@/components/MatchCard';
import type { SerializedMatch } from '@/lib/types';

export default function SchedulePage() {
  const [matches, setMatches] = useState<SerializedMatch[] | null>(null);
  const [error, setError] = useState('');

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

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <h2 className="mb-1 text-[15px] font-semibold">League Stage — 16 Matches / 8 Days</h2>
        <p className="mb-4 text-[13px] text-muted">Upcoming matches are shown in grey; completed ones show placements, kills and points.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
        {!error && !matches && <p className="text-sm text-muted">Loading…</p>}
        {!error && matches && (
          <div className="grid gap-2.5">
            {league.map((m) => (
              <MatchCard key={m.id} match={m} />
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
