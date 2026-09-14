import MatchCard from './MatchCard';
import type { SerializedMatch } from '@/lib/types';

interface DayAccordionProps {
  day: number;
  matches: SerializedMatch[];
  open: boolean;
  onToggle: () => void;
}

export default function DayAccordion({ day, matches, open, onToggle }: DayAccordionProps) {
  const completedCount = matches.filter((m) => m.status === 'completed').length;
  const allCompleted = completedCount === matches.length;
  const noneCompleted = completedCount === 0;
  const dateLabel = matches.find((m) => m.date)?.date;

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 bg-surface-2 px-3.5 py-3 text-left transition-colors hover:bg-surface-2/70"
      >
        <span className="flex items-baseline gap-2.5">
          <span className="text-[13.5px] font-semibold">Day {day}</span>
          {dateLabel && <span className="text-[11px] text-muted">{dateLabel}</span>}
        </span>
        <span className="flex items-center gap-2.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
              allCompleted ? 'bg-success/15 text-success' : noneCompleted ? 'bg-surface text-muted' : 'bg-accent/15 text-accent'
            }`}
          >
            {allCompleted ? 'Completed' : noneCompleted ? 'Upcoming' : `${completedCount}/${matches.length} played`}
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="space-y-2.5 px-3.5 pt-3 pb-3.5">
            {matches
              .slice()
              .sort((a, b) => a.matchNumber - b.matchNumber)
              .map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
