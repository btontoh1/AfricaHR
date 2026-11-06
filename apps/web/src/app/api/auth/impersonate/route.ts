import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createBackendClient } from '@/lib/backend-client';
import { ACCESS_TOKEN_COOKIE, decodeAccessToken } from '@/lib/session';
import { setImpersonationAccessTokenCookie } from '@/lib/auth-cookies';

/**
 * Starts an impersonation session as a platform admin. Deliberately its
 * own route rather than the generic [...path] proxy: that proxy always
 * writes back whatever cookies came out of a request, but here only the
 * ACCESS_TOKEN_COOKIE should ever change - the admin's own
 * REFRESH_TOKEN_COOKIE must survive untouched so it can later restore them
 * (see setImpersonationAccessTokenCookie).
 */
export async function POST(request: NextRequest) {
  const { tenantId, userId, reason } = await request.json();
  const store = await cookies();
  const adminAccessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!adminAccessToken) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
  }

  const client = createBackendClient(adminAccessToken);
  const { data, error, response } = await client.POST(
    '/api/tenants/{tenantId}/users/{id}/impersonate',
    {
      params: { path: { tenantId, id: userId } },
      body: { reason },
    },
  );

  if (error || !data) {
    const status = (response as Response).status;
    return NextResponse.json(
      error ?? { message: 'Failed to start impersonation' },
      { status },
    );
  }

  const user = decodeAccessToken(data.accessToken);
  const res = NextResponse.json({ user });
  setImpersonationAccessTokenCookie(res, data.accessToken);
  return res;
}
