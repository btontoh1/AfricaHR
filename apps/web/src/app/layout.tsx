import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './global.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const SITE_URL = 'https://parothr.com';
const SITE_NAME = 'ParotHR';
const SITE_DESCRIPTION =
  'HR, payroll and accounting software built for Ghana, Nigeria and Kenya. Payroll with PAYE, SSNIT, NSSF and pension handled automatically, plus leave, recruitment, performance, and full double-entry accounting in one platform.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — HR, Payroll & Accounting Software for Africa`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'HR software Ghana',
    'payroll software Ghana',
    'HR software Nigeria',
    'payroll software Nigeria',
    'HR software Kenya',
    'payroll software Kenya',
    'PAYE payroll software',
    'SSNIT payroll software',
    'NSSF payroll software',
    'accounting software Africa',
    'payroll software Africa',
    'HR management system Africa',
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — HR, Payroll & Accounting Software for Africa`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
    images: [{ url: '/logo.png', width: 850, height: 685, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary',
    title: `${SITE_NAME} — HR, Payroll & Accounting Software for Africa`,
    description: SITE_DESCRIPTION,
    images: ['/logo.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
