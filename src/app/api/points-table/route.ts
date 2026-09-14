import { NextResponse } from 'next/server';
import { loadState } from '@/lib/data';
import { buildPointsTable } from '@/lib/points';

export const dynamic = 'force-dynamic';

export async function GET() {
  const state = await loadState();
  return NextResponse.json({ table: buildPointsTable(state), league: state.league });
}
