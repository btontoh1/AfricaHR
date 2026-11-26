'use client';

import { useSession } from '../../session-provider';
import { CreateAnnouncementDialog } from '@/features/intranet/create-announcement-dialog';
import { AnnouncementsList } from '@/features/intranet/announcements-list';
import { PageHeader } from '@/components/page-header';

export default function AnnouncementsPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Post updates to the whole group, one company, or one department."
        action={<CreateAnnouncementDialog tenantId={tenantId} />}
      />
      <AnnouncementsList tenantId={tenantId} />
    </div>
  );
}
