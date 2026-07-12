'use client';

import { useSession } from '../session-provider';
import { CreateUserForm } from '@/features/iam/create-user-form';
import { TeamMembersList } from '@/features/iam/team-members-list';
import { PageHeader } from '@/components/page-header';

export default function TeamMembersPage() {
  const session = useSession();
  const canManage = session.role === 'TENANT_ADMIN';

  return (
    <div>
      <PageHeader title="Team members" description="Manage user accounts and access for your organization." />
      <div className="space-y-6">
        {canManage && <CreateUserForm />}
        <TeamMembersList canManage={canManage} />
      </div>
    </div>
  );
}
