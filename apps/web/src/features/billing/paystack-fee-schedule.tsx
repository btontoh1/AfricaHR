'use client';

import { Percent } from 'lucide-react';
import { usePaystackFeeRates } from './queries';
import { SetPaystackFeeRateDialog } from './set-paystack-fee-rate-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { EmptyState } from '@/components/empty-state';

const CHANNEL_LABELS: Record<string, string> = {
  MOBILE_MONEY: 'Mobile money',
  BANK_ACCOUNT: 'Bank account',
};

export function PaystackFeeSchedule() {
  const { data: rates, isLoading, isError, error } = usePaystackFeeRates();

  return (
    <div>
      <PageHeader
        title="Paystack Fees"
        description="Paystack's own real transfer cost by currency and channel - charged through to tenants at disbursement time, on top of ParotHR's own per-tenant margin (set on each tenant's subscription)."
        action={<SetPaystackFeeRateDialog />}
      />

      {isLoading ? (
        <CardSkeleton />
      ) : isError ? (
        <ErrorState message={getApiErrorMessage(error, 'Failed to load Paystack fee rates')} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rates configured</CardTitle>
          </CardHeader>
          <CardContent>
            {!rates || rates.length === 0 ? (
              <EmptyState
                icon={Percent}
                title="No fee rates configured yet"
                description="Tenants are disbursed with no Paystack real-cost pass-through until a rate is set for their currency and channel - only ParotHR's own margin, if any, is charged."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Currency</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead className="text-right">Fee</TableHead>
                    <TableHead>Last updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell>{rate.currency}</TableCell>
                      <TableCell>{CHANNEL_LABELS[rate.channel] ?? rate.channel}</TableCell>
                      <TableCell className="text-right">
                        <div>
                          {formatCurrency(rate.feeAmount, rate.currency)}
                          <span className="text-muted-foreground"> / transfer</span>
                        </div>
                        {rate.employeeCount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            × {rate.employeeCount} employee{rate.employeeCount === 1 ? '' : 's'} platform-wide ={' '}
                            {formatCurrency(rate.feeAmount * rate.employeeCount, rate.currency)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(rate.updatedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
