import 'server-only';
import { cookies } from 'next/headers';
import { createBackendClient } from './backend-client';
import { dedupeInFlight } from './dedupe-in-flight';
import { REFRESH_TOKEN_COOKIE } from './session';

// dedupeInFlight only collapses calls that overlap while the original is
// still pending - it can't help a request that wasn't dispatched yet when
// the first one finished and was removed from that map. The backend
// rotates refresh tokens on use with no grace window (see
// AuthService.refresh), so a handful of requests firing in a staggered
// burst (e.g. several widgets all going stale at once after the tab sat
// idle) can have one of them arrive carrying the *old* token just after
// another has already rotated it - a real, not hypothetical, token, just
// a stale one. Without this cache that reads as "invalid refresh token"
// and clears a perfectly healthy session (this is the random-logout
// symptom). Remembering the outcome of a rotation for a few seconds,
// keyed by the exact old token value that triggered it, means any
// trailing request still holding that same old value gets the same
// result instead of re-asking a backend that will correctly, but
// unhelpfully, say the token's already used.
const RECENTLY_ROTATED_TTL_MS = 10_000;
const recentlyRotated = new Map<string, { outcome: RefreshOutcome; expiresAt: number }>();

function rememberIfRotated(oldToken: string, outcome: RefreshOutcome): void {
  if (outcome.status !== 'refreshed') {
    return;
  }
  for (const [key, entry] of recentlyRotated) {
    if (entry.expiresAt <= Date.now()) {
      recentlyRotated.delete(key);
    }
  }
  recentlyRotated.set(oldToken, { outcome, expiresAt: Date.now() + RECENTLY_ROTATED_TTL_MS });
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * - 'refreshed': got a new token pair, safe to set cookies.
 * - 'invalid': the backend explicitly rejected the refresh token (expired,
 *   revoked, or there was no refresh-token cookie at all) - the session is
 *   genuinely over, safe to clear cookies.
 * - 'unavailable': the refresh call itself didn't go through (rate-limited,
 *   a transient 5xx, a network blip) - the refresh token was never
 *   presented to anything that could revoke it, so it may still be
 *   perfectly valid. Callers must NOT clear cookies on this outcome, or a
 *   healthy session gets killed by an unrelated infrastructure hiccup (see
 *   route.ts's and auth/refresh/route.ts's callers - this distinction is
 *   the fix for users getting randomly logged out).
 */
export type RefreshOutcome = ({ status: 'refreshed' } & RefreshResult) | { status: 'invalid' } | { status: 'unavailable' };

async function performRefresh(refreshToken: string): Promise<RefreshOutcome> {
  const client = createBackendClient();
  try {
    const { data, response } = await client.POST('/api/auth/refresh', { body: { refreshToken } });
    if (data) {
      return { status: 'refreshed', ...data };
    }
    // Only a definitive "this token is bad" rejection ends the session.
    // Anything else (429 from the shared-IP throttle, a transient 5xx) is
    // 'unavailable', not 'invalid'.
    return response.status === 401 ? { status: 'invalid' } : { status: 'unavailable' };
  } catch {
    // openapi-fetch rethrows on a true network-level failure (no response
    // at all) rather than returning it as `error` - same "don't end the
    // session over infrastructure, not the token" reasoning.
    return { status: 'unavailable' };
  }
}

/**
 * Exchanges the httpOnly refresh-token cookie for a new token pair.
 *
 * Concurrent calls sharing the same refresh-token cookie value are
 * collapsed into a single backend call via dedupeInFlight - see that
 * module's doc comment for why (the backend's single-use rotation means a
 * second independent call with the same token would otherwise fail and
 * clear a session that the first call had just made valid). A call that
 * arrives after that single call already finished instead checks
 * recentlyRotated first, for the same reason but the non-overlapping case
 * - see this file's top comment.
 */
export async function refreshSession(): Promise<RefreshOutcome> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return { status: 'invalid' };
  }

  const cached = recentlyRotated.get(refreshToken);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.outcome;
  }

  const outcome = await dedupeInFlight(refreshToken, () => performRefresh(refreshToken));
  rememberIfRotated(refreshToken, outcome);
  return outcome;
}
