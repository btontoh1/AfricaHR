'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { JobRequisition } from './types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

/**
 * Lets HR (or a hiring manager) grab the public, no-login-required link for
 * this requisition, to paste into the company's own careers page —
 * see apps/web/src/app/careers/[requisitionId]/page.tsx and
 * PublicApplicationController. The link only resolves while the
 * requisition is OPEN (that controller 404s otherwise), so it's still
 * shown outside OPEN — copyable in advance — with a note instead of being
 * hidden, since HR may want it ready before flipping status to OPEN.
 */
export function PublicApplicationLinkCard({ requisition }: { requisition: JobRequisition }) {
  const [copied, setCopied] = useState(false);

  const applyUrl = `${window.location.origin}/careers/${requisition.id}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
      toast.success('Application link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Public application link</CardTitle>
        <CardDescription>
          {requisition.status === 'OPEN'
            ? "Paste this into your company's website — anyone who applies lands directly in this pipeline."
            : "This link only accepts applications while the role is OPEN. Copy it now and it'll start working as soon as you open the role."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input readOnly value={applyUrl} className="font-mono text-sm" onFocus={(e) => e.target.select()} />
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
