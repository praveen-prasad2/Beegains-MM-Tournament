import type { TeamColor } from './types';

export const TEAM_COLOR_VAR: Record<TeamColor, string> = {
  Red: 'var(--team-red)',
  Blue: 'var(--team-blue)',
  Green: 'var(--team-green)',
  Yellow: 'var(--team-yellow)',
  Purple: 'var(--team-purple)',
  Orange: 'var(--team-orange)',
  Black: 'var(--team-black)',
  Brown: 'var(--team-brown)',
};

export function teamColorVar(color: TeamColor): string {
  return TEAM_COLOR_VAR[color] || 'var(--muted)';
}
