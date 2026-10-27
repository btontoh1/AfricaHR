'use client';

import { useSession } from '../../session-provider';
import { PayrollWalletView } from '@/features/payroll-wallet/payroll-wallet-view';

export default function PayrollWalletPage() {
  const session = useSession();
  const tenantId = session.tenantId as string;

  return <PayrollWalletView tenantId={tenantId} />;
}
