import { NextResponse } from 'next/server';
import { refreshSession } from '@/lib/refresh-session';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth-cookies';

export async function POST() {
  const result = await refreshSession();

  if (result.status === 'invalid') {
    const res = NextResponse.json({ message: 'Unable to refresh session' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }
  if (result.status === 'unavailable') {
    // Don't clear cookies here either - the refresh token itself may still
    // be valid, this attempt just couldn't confirm it (rate limit/transient
    // backend error). The caller can retry.
    return NextResponse.json({ message: 'Unable to refresh session right now' }, { status: 503 });
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, result.accessToken, result.refreshToken);
  return res;
}
