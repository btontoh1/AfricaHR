'use client';

import { RecordPaymentDialog } from './record-payment-dialog';
import { VendorPaymentsList } from './vendor-payments-list';

export function VendorPaymentsView({ tenantId, defaultVendorId }: { tenantId: string; defaultVendorId?: string }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <RecordPaymentDialog tenantId={tenantId} defaultVendorId={defaultVendorId} />
      </div>

      <VendorPaymentsList tenantId={tenantId} />
    </div>
  );
}
