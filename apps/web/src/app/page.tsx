import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { needsSetup } from '@/lib/setup-status';

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  redirect((await needsSetup()) ? '/setup' : '/login');
}
