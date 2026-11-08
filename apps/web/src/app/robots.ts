import type { MetadataRoute } from 'next';

const SITE_URL = 'https://parothr.com';

// Route groups like (app) don't add a URL segment, so every authenticated
// page lives at the bare top-level path shown here (mirrors the folders
// under apps/web/src/app/(app)/). Listed explicitly since there's no shared
// prefix to disallow in one line - keep in sync when a new (app) route is
// added.
const PRIVATE_PATHS = [
  '/account',
  '/attendance',
  '/benefits',
  '/customers',
  '/dashboard',
  '/employees',
  '/finance',
  '/how-it-works',
  '/invoices',
  '/leave',
  '/notifications',
  '/organizations',
  '/payment-method',
  '/payroll',
  '/payslips',
  '/performance',
  '/platform-admin',
  '/recruitment',
  '/reports',
  '/settings',
  '/team-members',
  '/vendor-bills',
  '/vendor-payments',
  '/vendors',
  '/setup',
  '/api/',
  // Tenant-specific login pages are thin, near-duplicate content - the
  // generic /login stays crawlable.
  '/login/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
