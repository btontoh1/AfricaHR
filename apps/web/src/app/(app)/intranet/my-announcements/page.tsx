'use client';

import { useSession } from '../../session-provider';
import { MyAnnouncementsFeed } from '@/features/intranet/my-announcements-feed';
import { PageHeader } from '@/components/page-header';

export default function MyAnnouncementsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader title="Announcements" description="The latest updates from across the group." />
      <MyAnnouncementsFeed tenantId={tenantId} />
    </div>
  );
}
