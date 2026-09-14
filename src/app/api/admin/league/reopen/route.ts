import { NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { loadState, saveState } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });
  const state = await loadState();
  state.league.complete = false;
  state.league.qualifiedTeamIds = [];
  await saveState(state);
  return NextResponse.json(state.league);
}
