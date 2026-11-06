import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { DemoRequestDialog } from './demo-request-dialog';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#countries', label: 'Where we operate' },
  { href: '/about', label: 'About' },
  { href: '/faq', label: 'FAQ' },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="size-8 rounded-lg" />
          <span className="text-lg font-semibold tracking-tight">ParotHR</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Login</Link>
          </Button>
          <DemoRequestDialog trigger={<Button variant="outline">Book a demo</Button>} />
          <Button asChild>
            <Link href="/login">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
