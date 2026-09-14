import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { loadState, saveState } from '@/lib/data';
import { buildPointsTable } from '@/lib/points';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });

  const state = await loadState();
  const body = await req.json().catch(() => ({}));
  const incomplete = state.matches.some((m) => m.stage === 'league' && m.status !== 'completed');
  if (incomplete && !body?.force) {
    return NextResponse.json({ error: 'Not all league matches are completed yet', incomplete: true }, { status: 400 });
  }
  const table = buildPointsTable(state);
  const qualifiedTeamIds = table.slice(0, 3).map((r) => r.teamId);
  state.league.complete = true;
  state.league.qualifiedTeamIds = qualifiedTeamIds;
  await saveState(state);
  return NextResponse.json(state.league);
}
