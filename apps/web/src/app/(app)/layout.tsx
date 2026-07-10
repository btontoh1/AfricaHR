import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AppShell } from './app-shell';
import { SessionProvider } from './session-provider';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider user={session}>
      <AppShell user={session}>{children}</AppShell>
    </SessionProvider>
  );
}
