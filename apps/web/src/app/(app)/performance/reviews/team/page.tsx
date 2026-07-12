'use client';

import { useSession } from '../../../session-provider';
import { TeamReviewsList } from '@/features/performance/team-reviews-list';
import { PageHeader } from '@/components/page-header';

export default function TeamReviewsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Team reviews" description="Complete manager assessments for your direct reports." />
      <TeamReviewsList tenantId={tenantId} />
    </div>
  );
}
