'use client';

import { createContext, useContext } from 'react';
import type { SessionUser } from '@/lib/session';

const SessionContext = createContext<SessionUser | null>(null);

export function SessionProvider({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return <SessionContext.Provider value={user}>{children}</SessionContext.Provider>;
}

/** Client components only — the session cookie itself is httpOnly, so this reads the value a Server Component already decoded and passed down, never the raw token. */
export function useSession(): SessionUser {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error('useSession must be used within the authenticated (app) route group');
  }
  return session;
}
