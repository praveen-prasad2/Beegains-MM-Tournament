import { NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { loadState } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });
  const { id } = await params;
  const state = await loadState();
  const history = state.audit.filter((a) => a.matchId === Number(id));
  return NextResponse.json(history);
}
