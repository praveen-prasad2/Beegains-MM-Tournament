import { NextRequest, NextResponse } from 'next/server';
import { loadState } from '@/lib/data';
import { buildDeathsLeaderboard } from '@/lib/points';
import type { Stage } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const state = await loadState();
  const stage = (req.nextUrl.searchParams.get('stage') || 'league') as Stage | 'all';
  return NextResponse.json(buildDeathsLeaderboard(state, stage));
}
