import { teamColorVar } from '@/lib/colors';
import type { TeamColor } from '@/lib/types';
import TeamLogo from './TeamLogo';

interface TeamBadgeProps {
  name: string;
  color: TeamColor;
  size?: 'sm' | 'md' | 'lg';
  /** 'dot' (default) keeps the compact admin look; 'logo' shows the team's emblem. */
  variant?: 'dot' | 'logo';
}

const sizeClasses: Record<NonNullable<TeamBadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-1 gap-1.5',
  md: 'text-[13px] px-2.5 py-1.5 gap-2',
  lg: 'text-sm px-3 py-2 gap-2',
};

const dotSize: Record<NonNullable<TeamBadgeProps['size']>, string> = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

const logoSize: Record<NonNullable<TeamBadgeProps['size']>, 'sm' | 'md' | 'lg'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
};

export default function TeamBadge({ name, color, size = 'md', variant = 'dot' }: TeamBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-border bg-surface-2 font-medium whitespace-nowrap ${sizeClasses[size]}`}
    >
      {variant === 'logo' ? (
        <TeamLogo name={name} color={color} size={logoSize[size]} />
      ) : (
        <span
          className={`rounded-full shrink-0 ring-1 ring-white/10 ${dotSize[size]}`}
          style={{ background: teamColorVar(color) }}
        />
      )}
      {name}
    </span>
  );
}
