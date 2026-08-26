import Link from 'next/link';
import { Logo } from '@/components/logo';

const PRODUCT_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#countries', label: 'Where we operate' },
  { href: '/#security', label: 'Security' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
  { href: '/testimonials', label: 'Customer feedback' },
];

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Refund & Cancellation Policy' },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 py-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="size-7 rounded-md" />
              <span className="text-sm font-semibold">ParotHR</span>
            </Link>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              HR and payroll built for how African businesses actually work.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Product</p>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Company</p>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:support@parothr.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Contact support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Legal</p>
            <ul className="mt-4 space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">&copy; {year} ParotHR. All rights reserved.</p>
          <p className="text-xs text-muted-foreground">10 Benin St. GC-000-6098, Ghana</p>
        </div>
      </div>
    </footer>
  );
}
