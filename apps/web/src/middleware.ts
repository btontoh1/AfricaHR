import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/auth-cookie-names';

// /careers is the public job-application flow — a candidate reaches it from
// a link a company embeds on its own website, never a logged-in session.
const PUBLIC_PATHS = ['/login', '/setup', '/careers'];

// Fast, cookie-presence-only gate — not a full JWT verification (Edge
// middleware has no easy access to the backend's signing secret, and
// doesn't need one: every real request still round-trips through the
// proxy Route Handler, which transparently refreshes an expired token or
// clears cookies and 401s if refresh also fails). This just avoids
// rendering a protected page at all when there's plainly no session.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root is the public marketing homepage (RootPage itself still redirects
  // a *logged-in* visitor straight to /dashboard) - deliberately an exact
  // match, not startsWith, since every path starts with "/" and that would
  // blow the gate open for the whole app.
  if (
    pathname === '/' ||
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(
    request.cookies.get(ACCESS_TOKEN_COOKIE) ?? request.cookies.get(REFRESH_TOKEN_COOKIE),
  );

  if (!hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png).*)'],
};
