'use client';

import { ShieldPlus } from 'lucide-react';
import { usePlatformAdmins } from './queries';
import { AddPlatformAdminDialog } from './add-platform-admin-dialog';
import { PlatformAdminsTable } from './platform-admins-table';
import { getApiErrorMessage } from '@/lib/api-error';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';

export function PlatformAdminsList() {
  const { data: admins, isLoading, isError, error } = usePlatformAdmins();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform admins"
        description="Full access across every tenant - there is no narrower role. Every change made under one of these accounts is attributed to that person by name, same as everything else in the audit log."
        action={<AddPlatformAdminDialog />}
      />

      {isLoading && <TableSkeleton rows={3} />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load platform admins')} />}

      {admins && admins.length === 0 && (
        <EmptyState
          icon={ShieldPlus}
          title="No platform admins yet"
          description="Add the first one with the button above."
        />
      )}

      {admins && admins.length > 0 && <PlatformAdminsTable admins={admins} />}
    </div>
  );
}
