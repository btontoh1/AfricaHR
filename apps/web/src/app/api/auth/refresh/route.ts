import { NextResponse } from 'next/server';
import { refreshSession } from '@/lib/refresh-session';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth-cookies';

export async function POST() {
  const result = await refreshSession();

  if (!result) {
    const res = NextResponse.json({ message: 'Unable to refresh session' }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, result.accessToken, result.refreshToken);
  return res;
}
