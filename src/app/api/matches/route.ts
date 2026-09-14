import { NextRequest, NextResponse } from 'next/server';
import { loadState } from '@/lib/data';
import { serializeMatch } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const state = await loadState();
  const stage = req.nextUrl.searchParams.get('stage');
  let matches = state.matches;
  if (stage) matches = matches.filter((m) => m.stage === stage);
  matches = matches
    .slice()
    .sort((a, b) => a.stage.localeCompare(b.stage) || a.day - b.day || a.matchNumber - b.matchNumber);
  return NextResponse.json(matches.map((m) => serializeMatch(state, m)));
}
