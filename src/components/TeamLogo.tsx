import { Crosshair, Crown, Flame, HandMetal, Shield, Skull, Swords, PenTool, type LucideIcon } from 'lucide-react';
import { teamColorDeepVar, teamColorVar } from '@/lib/colors';
import type { TeamColor } from '@/lib/types';

// One themed emblem per team, matched to what its name evokes.
const TEAM_ICONS: Record<string, LucideIcon> = {
  'Eldo x Rado': Flame,
  'Fight Club': HandMetal,
  'Death Dealers': Skull,
  'Doodle Army': PenTool,
  'Double Barrel': Crosshair,
  'Deadly Duo': Swords,
  'Nexus Avengers': Shield,
  '2 Kings': Crown,
};

interface TeamLogoProps {
  name: string;
  color: TeamColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const BADGE_PX: Record<NonNullable<TeamLogoProps['size']>, number> = { sm: 26, md: 34, lg: 46, xl: 72 };
const ICON_PX: Record<NonNullable<TeamLogoProps['size']>, number> = { sm: 13, md: 17, lg: 23, xl: 34 };

export default function TeamLogo({ name, color, size = 'md' }: TeamLogoProps) {
  const Icon = TEAM_ICONS[name] ?? Shield;
  const px = BADGE_PX[size];

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full ring-1 ring-white/15"
      style={{
        width: px,
        height: px,
        background: `linear-gradient(145deg, ${teamColorVar(color)} 0%, ${teamColorDeepVar(color)} 100%)`,
        boxShadow: `0 2px 8px -2px ${teamColorVar(color)}66, inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
    >
      <Icon size={ICON_PX[size]} strokeWidth={2.25} className="text-white drop-shadow-sm" />
    </span>
  );
}
