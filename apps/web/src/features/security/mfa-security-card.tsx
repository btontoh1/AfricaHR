'use client';

import { ShieldCheck } from 'lucide-react';
import { useMfaStatus } from './queries';
import { MfaEnrollment } from './mfa-enrollment';
import { MfaDisableDialog } from './mfa-disable-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';

export function MfaSecurityCard() {
  const { data: status, isLoading, isError, error } = useMfaStatus();

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !status) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load two-factor authentication status')} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Two-factor authentication
          {status.enabled && (
            <Badge variant="success" className="gap-1">
              <ShieldCheck className="size-3.5" />
              Enabled
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {status.enabled
            ? 'Your account is protected with an authenticator app.'
            : 'Not enabled on your account yet.'}
        </CardDescription>
      </CardHeader>
      <CardContent>{status.enabled ? <MfaDisableDialog /> : <MfaEnrollment />}</CardContent>
    </Card>
  );
}
