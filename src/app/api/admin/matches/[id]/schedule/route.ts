import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { loadState, saveState } from '@/lib/data';
import { findMatch, serializeMatch } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });

  const { id } = await params;
  const state = await loadState();
  const match = findMatch(state, Number(id));
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { day, matchNumber, teamIds, date, notes } = body || {};

  if (Array.isArray(teamIds)) {
    if (teamIds.length !== 3) return NextResponse.json({ error: 'A match needs exactly 3 teams' }, { status: 400 });
    const validIds = new Set(state.teams.map((t) => t.id));
    if (!teamIds.every((id: number) => validIds.has(Number(id)))) {
      return NextResponse.json({ error: 'Unknown team id in match' }, { status: 400 });
    }
    match.teams = teamIds.map((teamId: number) => {
      const existing = match.teams.find((mt) => mt.teamId === Number(teamId));
      return existing || { teamId: Number(teamId), placement: null, kills: 0, points: 0 };
    });
  }
  if (day !== undefined) match.day = Number(day);
  if (matchNumber !== undefined) match.matchNumber = Number(matchNumber);
  if (date !== undefined) match.date = date;
  if (notes !== undefined) match.notes = notes;

  await saveState(state);
  return NextResponse.json(serializeMatch(state, match));
}
