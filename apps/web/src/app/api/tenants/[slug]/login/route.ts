import { NextRequest, NextResponse } from 'next/server';
import { createBackendClient } from '@/lib/backend-client';
import { setAuthCookies } from '@/lib/auth-cookies';
import { decodeAccessToken } from '@/lib/session';

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json();
  const client = createBackendClient();
  const { data, error, response } = await client.POST('/api/tenants/{slug}/login', {
    params: { path: { slug } },
    body,
  });

  if (error || !data) {
    // Same caveat as api/auth/login/route.ts: the backend doesn't document
    // error responses in its OpenAPI spec, so openapi-fetch can't type
    // `response` in this branch — but it's still a real Response at runtime.
    const status = (response as Response).status;
    return NextResponse.json(error ?? { message: 'Login failed' }, { status });
  }

  const user = decodeAccessToken(data.accessToken);
  const res = NextResponse.json({ user });
  setAuthCookies(res, data.accessToken, data.refreshToken);
  return res;
}
