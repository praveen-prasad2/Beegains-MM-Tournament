import { NextResponse } from 'next/server';
import { loadState } from '@/lib/data';
import { findMatch, serializeMatch } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await loadState();
  const match = findMatch(state, Number(id));
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  return NextResponse.json(serializeMatch(state, match));
}
