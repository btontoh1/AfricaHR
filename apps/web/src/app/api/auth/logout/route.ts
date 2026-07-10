import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createBackendClient } from '@/lib/backend-client';
import { clearAuthCookies } from '@/lib/auth-cookies';
import { REFRESH_TOKEN_COOKIE } from '@/lib/session';

export async function POST() {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;

  if (refreshToken) {
    const client = createBackendClient();
    // Best-effort revocation — logout must succeed client-side even if the
    // backend call fails (e.g. the refresh token already expired), so the
    // user is never stuck unable to clear a stale session.
    await client.POST('/api/auth/logout', { body: { refreshToken } }).catch(() => undefined);
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
