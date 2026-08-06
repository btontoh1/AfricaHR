'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useMyTenant } from './queries';
import { LogoSettingsCard } from './logo-settings-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { PageHeader } from '@/components/page-header';

export function TenantSettings() {
  const { data: tenant, isLoading, isError, error } = useMyTenant();
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !tenant) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load organization settings')} />;
  }

  const loginUrl = `${window.location.origin}/login/${tenant.slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(loginUrl);
      setCopied(true);
      toast.success('Login URL copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description={tenant.name} />

      <Card>
        <CardHeader>
          <CardTitle>Sign-in link</CardTitle>
          <CardDescription>
            Share this link with your team — it takes them straight to {tenant.name}&apos;s own sign-in page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input readOnly value={loginUrl} className="font-mono text-sm" onFocus={(e) => e.target.select()} />
            <Button type="button" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <LogoSettingsCard tenant={tenant} />
    </div>
  );
}
