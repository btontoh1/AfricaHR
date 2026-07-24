import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { PageHeader } from '@/components/page-header';
import { VerificationQueueTable } from '@/features/organization-verification/verification-queue-table';

/**
 * Platform-admin only - a tenant cannot self-certify its own legal-entity
 * verification (see OrganizationVerificationController on the backend).
 * This route isn't in nav-config for anyone else, but the URL itself isn't
 * secret, so the page has to enforce this itself too - first server-side
 * role redirect in the app (AppLayout only redirects on no session at all).
 */
export default async function VerificationQueuePage() {
  const session = await getSession();
  if (session?.role !== 'PLATFORM_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div>
      <PageHeader title="Verification queue" description="Organizations awaiting legal-entity verification" />
      <VerificationQueueTable />
    </div>
  );
}
