import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { needsSetup } from '@/lib/setup-status';
import { LandingPage } from '@/features/marketing/landing-page';

export const metadata: Metadata = {
  title: 'HR, Payroll & Accounting Software for Ghana, Nigeria & Kenya',
  description:
    'Run payroll with PAYE, SSNIT and NSSF handled automatically, plus leave, recruitment, performance reviews, and full double-entry accounting - vendor bills, expenses, bank reconciliation, fixed assets, and financial reports - in one platform built for Ghana, Nigeria and Kenya.',
  alternates: { canonical: '/' },
};

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
