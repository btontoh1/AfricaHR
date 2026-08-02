'use client';

import { ChangePasswordDialog } from './change-password-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PasswordSecurityCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>Change the password you use to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChangePasswordDialog />
      </CardContent>
    </Card>
  );
}
