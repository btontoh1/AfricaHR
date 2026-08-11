import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { needsSetup } from '@/lib/setup-status';
import { LandingPage } from '@/features/marketing/landing-page';

export default async function RootPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  if (await needsSetup()) {
    redirect('/setup');
  }

  return <LandingPage />;
}
