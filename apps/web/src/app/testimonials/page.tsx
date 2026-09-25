import type { Metadata } from 'next';
import { TestimonialsPage } from '@/features/marketing/testimonials-page';

export const metadata: Metadata = {
  title: 'Testimonials',
  description: 'What HR and finance teams in Ghana, Nigeria and Kenya say about running their business on ParotHR.',
  alternates: { canonical: '/testimonials' },
};

export default function Page() {
  return <TestimonialsPage />;
}
