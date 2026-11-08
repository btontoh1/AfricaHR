import type { Metadata } from 'next';
import { RefundPolicyPage } from '@/features/marketing/refund-policy-page';

export const metadata: Metadata = {
  title: 'Refund Policy',
  alternates: { canonical: '/refund-policy' },
};

export default function Page() {
  return <RefundPolicyPage />;
}
