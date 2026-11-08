'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { SessionUser } from '@/lib/session';

/**
 * Deliberately violet - none of the chrome's other colors (primary,
 * destructive, success, warning) are used for anything persistent, so an
 * impersonation session can never be mistaken for a normal one at a
 * glance. Renders nothing for a normal session (no `act` claim).
 *
 * Exit reuses the existing refresh route rather than a dedicated
 * endpoint: only this session's ACCESS_TOKEN_COOKIE was ever overwritten
 * to start impersonating (see setImpersonationAccessTokenCookie), so the
 * admin's own REFRESH_TOKEN_COOKIE is still sitting there, and refreshing
 * with it mints a fresh access token back in the admin's own identity.
 * The same thing happens automatically if the 30-minute impersonation
 * token simply expires and nobody clicked Exit - the proxy's existing
 * 401-then-refresh retry degrades back to the admin, never the other way.
 */
export function ImpersonationBanner({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  if (!user.act) {
    return null;
  }

  async function handleExit() {
    setExiting(true);
    await fetch('/api/auth/refresh', { method: 'POST' });
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-violet-600 px-4 py-2 text-sm font-medium text-white print:hidden">
      <span>Viewing as {user.email}</span>
      <Button
        type="button"
        size="sm"
        className="h-7 bg-white text-violet-700 hover:bg-white/90"
        onClick={handleExit}
        disabled={exiting}
      >
        {exiting ? 'Exiting…' : 'Exit'}
      </Button>
    </div>
  );
}
