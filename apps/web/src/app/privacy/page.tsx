import type { Metadata } from 'next';
import { PrivacyPage } from '@/features/marketing/privacy-page';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  alternates: { canonical: '/privacy' },
};

export default function Page() {
  return <PrivacyPage />;
}
