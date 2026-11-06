import type { Metadata } from 'next';
import { SupportPage } from '@/features/marketing/support-page';

export const metadata: Metadata = {
  title: 'Support',
  description:
    'How to reach ParotHR support: contact channels, support hours, response time targets, escalation, and what is covered.',
  alternates: { canonical: '/support' },
};

export default function Page() {
  return <SupportPage />;
}
