import TeamBadge from './TeamBadge';
import { ordinal } from '@/lib/api-client';
import type { SerializedMatch } from '@/lib/types';

export default function MatchCard({ match }: { match: SerializedMatch }) {
  const completed = match.status === 'completed';
  const label = match.stage === 'league' ? `Day ${match.day} · Match ${match.matchNumber}` : `Finals · Match ${match.matchNumber}`;
  const teams = completed ? [...match.teams].sort((a, b) => (a.placement ?? 9) - (b.placement ?? 9)) : match.teams;

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3.5">
      <div className="mb-2.5 flex items-center justify-between gap-2 text-[12px] text-muted">
        <span>
          {label}
          {match.date ? ` · ${match.date}` : ''}
        </span>
        <span className="flex items-center gap-1.5">
          {match.stage === 'finals' && (
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">Finals</span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              completed ? 'bg-success/15 text-success' : 'bg-surface text-muted'
            }`}
          >
            {completed ? 'Completed' : 'Upcoming'}
          </span>
        </span>
      </div>

      {completed ? (
        <div className="space-y-1.5">
          {teams.map((t) => (
            <div key={t.teamId} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <TeamBadge name={t.teamName} color={t.color ?? 'Black'} />
              <span className="text-[12px] text-muted">
                {ordinal(t.placement ?? 0)} · {t.kills} kills · {t.points} pts
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {teams.map((t, i) => (
            <span key={t.teamId} className="flex items-center gap-2">
              {i > 0 && <span className="text-[11px] text-muted">vs</span>}
              <TeamBadge name={t.teamName} color={t.color ?? 'Black'} />
            </span>
          ))}
        </div>
      )}

      {match.notes && <p className="mt-2 text-[12px] text-muted">{match.notes}</p>}
    </div>
  );
}
