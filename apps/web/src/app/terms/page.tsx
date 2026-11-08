import type { Metadata } from 'next';
import { TermsPage } from '@/features/marketing/terms-page';

export const metadata: Metadata = {
  title: 'Terms of Service',
  alternates: { canonical: '/terms' },
};

export default function Page() {
  return <TermsPage />;
}
