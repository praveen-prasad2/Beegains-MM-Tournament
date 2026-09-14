import { NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { loadState, saveState } from '@/lib/data';
import { findMatch } from '@/lib/serialize';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });

  const { id } = await params;
  const state = await loadState();
  const match = findMatch(state, Number(id));
  if (!match || match.stage !== 'finals') return NextResponse.json({ error: 'Finals match not found' }, { status: 404 });
  if (match.status === 'completed') {
    return NextResponse.json({ error: 'Cannot delete a completed match; edit its result instead' }, { status: 400 });
  }
  state.matches = state.matches.filter((m) => m.id !== match.id);
  await saveState(state);
  return NextResponse.json({ ok: true });
}
