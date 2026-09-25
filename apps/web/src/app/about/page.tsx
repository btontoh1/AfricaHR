import type { Metadata } from 'next';
import { AboutPage } from '@/features/marketing/about-page';

export const metadata: Metadata = {
  title: 'About',
  description: 'ParotHR builds HR, payroll and accounting software for businesses in Ghana, Nigeria and Kenya.',
  alternates: { canonical: '/about' },
};

export default function Page() {
  return <AboutPage />;
}
