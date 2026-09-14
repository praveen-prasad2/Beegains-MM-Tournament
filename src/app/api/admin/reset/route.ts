import { NextRequest, NextResponse } from 'next/server';
import { isAdminSession } from '@/lib/auth';
import { resetState } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!(await isAdminSession())) return NextResponse.json({ error: 'Admin login required' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== 'RESET') {
    return NextResponse.json({ error: 'Confirmation required: send { confirm: "RESET" }' }, { status: 400 });
  }
  await resetState();
  return NextResponse.json({ ok: true });
}
