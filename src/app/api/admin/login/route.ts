import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';
import { createSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body || {};
  if (username === config.admin.username && password === config.admin.password) {
    await createSession(username);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
