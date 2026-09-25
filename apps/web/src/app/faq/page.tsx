import type { Metadata } from 'next';
import { FaqPage } from '@/features/marketing/faq-page';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Common questions about ParotHR: payroll compliance in Ghana, Nigeria and Kenya, pricing, security, and how the platform works.',
  alternates: { canonical: '/faq' },
};

export default function Page() {
  return <FaqPage />;
}
