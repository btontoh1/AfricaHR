'use client';

import { useBenefitContribution, useMyBenefitContribution } from './queries';
import { formatCurrency } from '@/lib/format-currency';

export function ContributionCell({
  tenantId,
  enrollmentId,
  self,
}: {
  tenantId: string;
  enrollmentId: string;
  self?: boolean;
}) {
  const adminQuery = useBenefitContribution(tenantId, self ? '' : enrollmentId);
  const selfQuery = useMyBenefitContribution(tenantId, self ? enrollmentId : '');
  const { data: contribution, isLoading, isError } = self ? selfQuery : adminQuery;

  if (isLoading) return <span className="text-muted-foreground">…</span>;
  if (isError || !contribution) return <span className="text-muted-foreground">—</span>;

  return (
    <span>
      {formatCurrency(contribution.employee, null)} / {formatCurrency(contribution.employer, null)}
    </span>
  );
}
