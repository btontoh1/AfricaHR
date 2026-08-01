import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE } from '@/lib/session';
import { refreshSession } from '@/lib/refresh-session';
import { clearAuthCookies, setAuthCookies } from '@/lib/auth-cookies';
import { toNextResponse } from '@/lib/proxy-response';

/**
 * Transparent auth-injecting proxy: the browser only ever calls
 * /api/proxy/*, never the NestJS API directly, so the raw access token
 * never reaches client-side JS. The backend still enforces every real
 * authorization decision (tenant scope, permissions, ownership) — this
 * proxy's only job is attaching the bearer token and retrying once after
 * a transparent refresh on 401.
 */
async function forward(
  method: string,
  url: string,
  contentType: string | null,
  body: string | undefined,
  accessToken: string | undefined,
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': contentType ?? 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body,
  });
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;

  const url = `${process.env.API_BASE_URL}/${path.join('/')}${request.nextUrl.search}`;
  const contentType = request.headers.get('content-type');
  // Read the body exactly once - a Request's body stream can only be
  // consumed a single time, and the retry-after-refresh below reuses this
  // same string rather than re-reading `request` a second time.
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.text();

  const firstAttempt = await forward(request.method, url, contentType, body, accessToken);
  if (firstAttempt.status !== 401) {
    return toNextResponse(firstAttempt);
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    const res = await toNextResponse(firstAttempt);
    clearAuthCookies(res);
    return res;
  }

  const retried = await forward(request.method, url, contentType, body, refreshed.accessToken);
  const res = await toNextResponse(retried);
  setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);
  return res;
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
