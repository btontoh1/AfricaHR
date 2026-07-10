'use client';

import { useSession } from '../../../session-provider';
import { TeamReviewsList } from '@/features/performance/team-reviews-list';

export default function TeamReviewsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team reviews</h1>
      <TeamReviewsList tenantId={tenantId} />
    </div>
  );
}
