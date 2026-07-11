import { NextRequest, NextResponse } from 'next/server';
import { createBackendClient } from '@/lib/backend-client';
import { setAuthCookies } from '@/lib/auth-cookies';
import { decodeAccessToken } from '@/lib/session';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const client = createBackendClient();
  const { data, error, response } = await client.POST('/api/setup', { body });

  if (error || !data) {
    const status = (response as Response).status;
    return NextResponse.json(error ?? { message: 'Setup failed' }, { status });
  }

  const user = decodeAccessToken(data.accessToken);
  const res = NextResponse.json({ user });
  setAuthCookies(res, data.accessToken, data.refreshToken);
  return res;
}
