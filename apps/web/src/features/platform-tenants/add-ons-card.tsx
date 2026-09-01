'use client';

import { toast } from 'sonner';
import { useUpdateTenantAddOn } from './queries';
import type { AddOnModule, Tenant } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const ADD_ON_LABEL: Record<AddOnModule, { title: string; description: string }> = {
  INVOICING: {
    title: 'Invoicing',
    description: 'Customers and customer invoices, with logo-branded PDF downloads.',
  },
  RECRUITMENT: {
    title: 'Recruitment',
    description: 'Job requisitions, candidates, and applications.',
  },
  PERFORMANCE: {
    title: 'Performance',
    description: 'Goals, review cycles, and performance reviews.',
  },
};

const ALL_ADD_ONS: AddOnModule[] = ['INVOICING', 'RECRUITMENT', 'PERFORMANCE'];

export function AddOnsCard({ tenant }: { tenant: Tenant }) {
  const updateAddOn = useUpdateTenantAddOn(tenant.id);

  async function handleToggle(module: AddOnModule, enabled: boolean) {
    try {
      await updateAddOn.mutateAsync({ module, enabled });
      toast.success(`${ADD_ON_LABEL[module].title} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update add-on'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add-ons</CardTitle>
        <CardDescription>
          Paid modules enabled for this tenant. Toggling here is manual - handle payment outside the app first,
          same as assigning a subscription.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ALL_ADD_ONS.map((module) => {
          const enabled = tenant.enabledAddOns.includes(module);
          return (
            <div key={module} className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor={`add-on-${module}`}>{ADD_ON_LABEL[module].title}</Label>
                <p className="text-sm text-muted-foreground">{ADD_ON_LABEL[module].description}</p>
              </div>
              <Switch
                id={`add-on-${module}`}
                checked={enabled}
                disabled={updateAddOn.isPending}
                onCheckedChange={(checked) => handleToggle(module, checked)}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
