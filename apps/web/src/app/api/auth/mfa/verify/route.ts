import { NextRequest, NextResponse } from 'next/server';
import { createBackendClient } from '@/lib/backend-client';
import { setAuthCookies, setDeviceTokenCookie } from '@/lib/auth-cookies';
import { decodeAccessToken } from '@/lib/session';

// Tenant-agnostic: the challenge token already carries its tenantId (set by
// AuthService.authenticate() at login), so this one route handler serves
// both the global and tenant-slug login forms.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = createBackendClient();
  const { data, error, response } = await client.POST('/api/auth/mfa/verify', { body });

  if (error || !data) {
    const status = (response as Response).status;
    return NextResponse.json(error ?? { message: 'Verification failed' }, { status });
  }

  const user = decodeAccessToken(data.accessToken);
  const res = NextResponse.json({ user });
  setAuthCookies(res, data.accessToken, data.refreshToken);
  if (data.deviceToken) {
    setDeviceTokenCookie(res, data.deviceToken);
  }
  return res;
}
