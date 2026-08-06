'use client';

import { PasswordSecurityCard } from '@/features/security/password-security-card';
import { MfaSecurityCard } from '@/features/security/mfa-security-card';
import { PageHeader } from '@/components/page-header';

export function AccountSettings() {
  return (
    <div className="space-y-6">
      <PageHeader title="My account" description="Manage your own sign-in credentials." />
      <PasswordSecurityCard />
      <MfaSecurityCard />
    </div>
  );
}
