import { NextRequest, NextResponse } from 'next/server';
import { createBackendClient } from '@/lib/backend-client';
import { setAuthCookies } from '@/lib/auth-cookies';
import { decodeAccessToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = createBackendClient();
  const { data, error, response } = await client.POST('/api/auth/login', { body });

  if (error || !data) {
    // The backend doesn't document error responses in its OpenAPI spec
    // (only the 200 case), so openapi-fetch can't type `response` in this
    // branch — but it's still a real Response object at runtime.
    const status = (response as Response).status;
    return NextResponse.json(error ?? { message: 'Login failed' }, { status });
  }

  const user = decodeAccessToken(data.accessToken);
  const res = NextResponse.json({ user });
  setAuthCookies(res, data.accessToken, data.refreshToken);
  return res;
}
