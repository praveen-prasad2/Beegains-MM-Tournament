import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { loadState, saveState } from '@/lib/data';
import { serializeMatch } from '@/lib/serialize';
import type { Match } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });

  const state = await loadState();
  if (!state.league.complete || state.league.qualifiedTeamIds.length !== 3) {
    return NextResponse.json({ error: 'League stage must be completed with 3 qualified teams first' }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const finalsMatches = state.matches.filter((m) => m.stage === 'finals');
  const matchNumber = finalsMatches.length + 1;
  const match: Match = {
    id: state.nextIds.match++,
    stage: 'finals',
    day: 1,
    matchNumber,
    status: 'scheduled',
    date: body?.date ?? null,
    notes: body?.notes ?? '',
    teams: state.league.qualifiedTeamIds.map((teamId) => ({ teamId, placement: null, kills: 0, points: 0 })),
    players: [],
  };
  state.matches.push(match);
  await saveState(state);
  return NextResponse.json(serializeMatch(state, match));
}
