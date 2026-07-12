'use client';

import { useState } from 'react';
import { usePayrollCostReport } from './queries';
import { getDefaultDateRange } from './date-range';
import { OrganizationFilter, ALL_ORGANIZATIONS } from './organization-filter';
import { StatCard } from './stat-card';
import { getApiErrorMessage } from '@/lib/api-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';

export function PayrollCostReport({ tenantId }: { tenantId: string }) {
  const [organizationId, setOrganizationId] = useState(ALL_ORGANIZATIONS);
  const [{ from, to }, setRange] = useState(getDefaultDateRange());

  const { data: report, isLoading, isError, error } = usePayrollCostReport(tenantId, {
    organizationId: organizationId === ALL_ORGANIZATIONS ? undefined : organizationId,
    from,
    to,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <OrganizationFilter tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
        <div>
          <Label htmlFor="payroll-cost-from">From</Label>
          <Input
            id="payroll-cost-from"
            type="date"
            value={from}
            onChange={(e) => setRange((prev) => ({ ...prev, from: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="payroll-cost-to">To</Label>
          <Input
            id="payroll-cost-to"
            type="date"
            value={to}
            onChange={(e) => setRange((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>
      </div>

      {isLoading && <CardSkeleton />}

      {isError && <ErrorState message={getApiErrorMessage(error, 'Failed to load the payroll cost report')} />}

      {report && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Payslips" value={report.payslipCount} />
          <StatCard label="Gross pay" value={report.totalGrossPay} />
          <StatCard label="Net pay" value={report.totalNetPay} />
          <StatCard label="Total deductions" value={report.totalDeductions} />
          <StatCard label="Employer cost" value={report.totalEmployerCost} />
        </div>
      )}
    </div>
  );
}
