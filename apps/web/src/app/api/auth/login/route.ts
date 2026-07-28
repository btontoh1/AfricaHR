import { NextRequest, NextResponse } from 'next/server';
import { createBackendClient } from '@/lib/backend-client';
import { setAuthCookies } from '@/lib/auth-cookies';
import { decodeAccessToken } from '@/lib/session';
import { DEVICE_TOKEN_COOKIE } from '@/lib/auth-cookie-names';

// Must match AuthController's DEVICE_TOKEN_HEADER on the backend.
const DEVICE_TOKEN_HEADER = 'x-device-token';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const deviceToken = request.cookies.get(DEVICE_TOKEN_COOKIE)?.value;
  const client = createBackendClient();
  const { data, error, response } = await client.POST('/api/auth/login', {
    body,
    headers: deviceToken ? { [DEVICE_TOKEN_HEADER]: deviceToken } : undefined,
  });

  if (error || !data) {
    // The backend doesn't document error responses in its OpenAPI spec
    // (only the 200 case), so openapi-fetch can't type `response` in this
    // branch — but it's still a real Response object at runtime.
    const status = (response as Response).status;
    return NextResponse.json(error ?? { message: 'Login failed' }, { status });
  }

  if ('mfaRequired' in data) {
    // No cookies yet — the caller still has to prove the second factor via
    // /api/auth/mfa/verify before a session exists.
    return NextResponse.json(data);
  }

  const user = decodeAccessToken(data.accessToken);
  const res = NextResponse.json({ user });
  setAuthCookies(res, data.accessToken, data.refreshToken);
  return res;
}
