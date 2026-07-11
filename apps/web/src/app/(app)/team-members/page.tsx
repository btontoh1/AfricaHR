'use client';

import { useSession } from '../session-provider';
import { CreateUserForm } from '@/features/iam/create-user-form';
import { TeamMembersList } from '@/features/iam/team-members-list';

export default function TeamMembersPage() {
  const session = useSession();
  const canManage = session.role === 'TENANT_ADMIN';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team members</h1>
      {canManage && <CreateUserForm />}
      <TeamMembersList canManage={canManage} />
    </div>
  );
}
