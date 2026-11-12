import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AppShell } from './app-shell';
import { SessionProvider } from './session-provider';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  // A kiosk device account has no business ever seeing the admin shell -
  // every route in this group funnels through here, so this is the one
  // place that needs to know about it, regardless of how a KIOSK session
  // got pointed at an (app) route (fresh login, bookmark, back button, ...).
  if (session.role === 'KIOSK') {
    redirect('/attendance/kiosk');
  }

  return (
    <SessionProvider user={session}>
      <AppShell user={session}>{children}</AppShell>
    </SessionProvider>
  );
}
