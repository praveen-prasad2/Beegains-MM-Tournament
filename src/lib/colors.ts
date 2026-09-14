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

export const TEAM_COLOR_DEEP_VAR: Record<TeamColor, string> = {
  Red: 'var(--team-red-deep)',
  Blue: 'var(--team-blue-deep)',
  Green: 'var(--team-green-deep)',
  Yellow: 'var(--team-yellow-deep)',
  Purple: 'var(--team-purple-deep)',
  Orange: 'var(--team-orange-deep)',
  Black: 'var(--team-black-deep)',
  Brown: 'var(--team-brown-deep)',
};

export function teamColorVar(color: TeamColor): string {
  return TEAM_COLOR_VAR[color] || 'var(--muted)';
}

export function teamColorDeepVar(color: TeamColor): string {
  return TEAM_COLOR_DEEP_VAR[color] || 'var(--muted)';
}
