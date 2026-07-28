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
  request: NextRequest,
  path: string[],
  accessToken: string | undefined,
): Promise<Response> {
  const url = `${process.env.API_BASE_URL}/${path.join('/')}${request.nextUrl.search}`;
  const hasBody = !['GET', 'HEAD'].includes(request.method);

  return fetch(url, {
    method: request.method,
    headers: {
      ...(hasBody ? { 'Content-Type': request.headers.get('content-type') ?? 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: hasBody ? await request.text() : undefined,
  });
}

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const store = await cookies();
  const accessToken = store.get(ACCESS_TOKEN_COOKIE)?.value;

  const firstAttempt = await forward(request, path, accessToken);
  if (firstAttempt.status !== 401) {
    return toNextResponse(firstAttempt);
  }

  const refreshed = await refreshSession();
  if (!refreshed) {
    const res = await toNextResponse(firstAttempt);
    clearAuthCookies(res);
    return res;
  }

  const retried = await forward(request, path, refreshed.accessToken);
  const res = await toNextResponse(retried);
  setAuthCookies(res, refreshed.accessToken, refreshed.refreshToken);
  return res;
}

export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
