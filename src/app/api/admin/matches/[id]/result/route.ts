import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { loadState, saveState } from '@/lib/data';
import { computeMatchPoints } from '@/lib/points';
import { findMatch, playerTeam, serializeMatch } from '@/lib/serialize';
import type { PlayerMatchStat } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });

  const { id } = await params;
  const state = await loadState();
  const match = findMatch(state, Number(id));
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { teams, players, notes, date } = body || {};

  if (!Array.isArray(teams) || teams.length !== 3) {
    return NextResponse.json({ error: 'Result must include placements for exactly 3 teams' }, { status: 400 });
  }
  const placements = teams.map((t: { placement: number }) => Number(t.placement));
  const validPlacementSet = new Set([1, 2, 3]);
  if (!placements.every((p: number) => validPlacementSet.has(p)) || new Set(placements).size !== 3) {
    return NextResponse.json({ error: 'Placements must be a unique permutation of 1, 2, 3' }, { status: 400 });
  }
  const matchTeamIds = new Set(match.teams.map((mt) => mt.teamId));
  if (!teams.every((t: { teamId: number }) => matchTeamIds.has(Number(t.teamId)))) {
    return NextResponse.json({ error: 'Submitted teams do not match the scheduled teams for this match' }, { status: 400 });
  }

  const before = JSON.parse(JSON.stringify(match));

  const playersByTeam = new Map<number, PlayerMatchStat[]>();
  for (const mt of match.teams) playersByTeam.set(mt.teamId, []);
  const playerList = Array.isArray(players) ? players : [];
  for (const ps of playerList) {
    const team = playerTeam(state, Number(ps.playerId));
    if (!team || !matchTeamIds.has(team.id)) continue;
    playersByTeam.get(team.id)!.push({
      playerId: Number(ps.playerId),
      kills: Math.max(0, Number(ps.kills) || 0),
      deaths: ps.deaths === undefined || ps.deaths === null ? 1 : Math.max(0, Number(ps.deaths) || 0),
    });
  }

  match.teams = match.teams.map((mt) => {
    const resultEntry = teams.find((t: { teamId: number }) => Number(t.teamId) === mt.teamId);
    const placement = Number(resultEntry.placement) as 1 | 2 | 3;
    const teamPlayers = playersByTeam.get(mt.teamId) || [];
    const kills = teamPlayers.reduce((sum, p) => sum + p.kills, 0);
    const pts = computeMatchPoints(kills, placement);
    return { teamId: mt.teamId, placement, kills, points: pts };
  });
  match.players = [...playersByTeam.values()].flat();
  match.status = 'completed';
  if (notes !== undefined) match.notes = notes;
  if (date !== undefined) match.date = date;

  const auditId = state.nextIds.audit++;
  state.audit.push({
    id: auditId,
    matchId: match.id,
    timestamp: new Date().toISOString(),
    before,
    after: JSON.parse(JSON.stringify(match)),
  });

  await saveState(state);
  return NextResponse.json(serializeMatch(state, match));
}
