import Link from 'next/link';
import {
  ArrowRight,
  Banknote,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  KeyRound,
  ScrollText,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { DemoRequestDialog } from './demo-request-dialog';

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#countries', label: 'Where we operate' },
  { href: '#security', label: 'Security' },
];

const COUNTRIES = [
  {
    flag: '🇬🇭',
    name: 'Ghana',
    currency: 'GHS',
    statutory: ['SSNIT contributions', 'PAYE income tax'],
  },
  {
    flag: '🇳🇬',
    name: 'Nigeria',
    currency: 'NGN',
    statutory: ['PAYE with rent relief', 'Pension & NHIS'],
  },
  {
    flag: '🇰🇪',
    name: 'Kenya',
    currency: 'KES',
    statutory: ['NSSF contributions', 'PAYE with personal relief'],
  },
];

const FEATURES = [
  {
    icon: Users,
    title: 'Employee management',
    description:
      'One record per employee - profile, family members, org unit, and reporting line - instead of scattered spreadsheets.',
  },
  {
    icon: Banknote,
    title: 'Payroll',
    description:
      "Run pay cycles in each country's own currency, with the statutory deductions above calculated automatically and paid straight to employee bank accounts.",
  },
  {
    icon: CalendarDays,
    title: 'Leave & attendance',
    description:
      'Leave types, balances, and approvals your team can self-serve, with attendance policies and records in the same place.',
  },
  {
    icon: Briefcase,
    title: 'Recruitment',
    description:
      'Post a requisition, share a public application link on your own site, and track every candidate through one pipeline.',
  },
  {
    icon: Target,
    title: 'Performance reviews',
    description:
      'Goals, review cycles, and manager feedback that stay attached to the employee record, not a separate tool.',
  },
  {
    icon: HeartHandshake,
    title: 'Benefits',
    description:
      'Define benefit plans and let employees enroll themselves, with HR keeping full visibility over every enrollment.',
  },
];

const STEPS = [
  {
    number: '01',
    title: 'Set up your organization',
    description:
      'Bring your company structure in - one organization, or several under a single account, each with its own admin if you need it.',
  },
  {
    number: '02',
    title: 'Onboard your team',
    description:
      'Add employees once and every module - payroll, leave, performance, benefits - already knows who they are.',
  },
  {
    number: '03',
    title: 'Run the day-to-day',
    description:
      'Payroll runs, leave requests, reviews, and hiring all happen inside the same system, with the right people seeing only what they should.',
  },
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: 'Tenant isolation by design',
    description: "Every customer's data is isolated at the database layer, not just filtered in application code.",
  },
  {
    icon: KeyRound,
    title: 'Role-based access control',
    description:
      'From platform admins down to a single organization admin managing one team, access is scoped to exactly what each role needs.',
  },
  {
    icon: ScrollText,
    title: 'Multi-factor authentication & audit logs',
    description: 'Optional MFA on every account, with an audit trail of who changed what and when.',
  },
];

// Hand-built preview of the product's own dashboard (mirrors
// apps/web/src/app/(app)/dashboard) rather than a real screenshot - keeps
// this page free of any real tenant's data while still showing accurately
// what signing in actually looks like.
function ProductPreview() {
  const bars = [38, 52, 46, 60, 71, 55, 64, 48, 58, 66, 50, 62];
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-lg">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/60" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-warning/60" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-success/60" aria-hidden="true" />
          <span className="ml-3 text-xs text-muted-foreground">app.parothr.com/dashboard</span>
        </div>
        <div className="space-y-4 p-5">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-xs font-medium text-muted-foreground">Payroll cost trend</p>
            <div className="mt-4 flex h-28 items-end gap-1.5">
              {bars.map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-sm bg-primary/70"
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Employees</p>
              <p className="mt-1 text-xl font-semibold">128</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Open reqs</p>
              <p className="mt-1 text-xl font-semibold">4</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-medium text-muted-foreground">Pending leave</p>
              <p className="mt-1 text-xl font-semibold">6</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Logo className="size-8 rounded-lg" />
            <span className="text-lg font-semibold tracking-tight">ParotHR</span>
          </div>
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

      <main className="flex-1">
        {/* Hero - asymmetric two-column, not centered, so the page has an
            actual focal point instead of everything stacked on one axis. */}
        <section className="overflow-hidden px-4 pt-14 pb-20 sm:pt-20 lg:px-8">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <span aria-hidden="true">🇬🇭 🇳🇬 🇰🇪</span>
                Live in Ghana, Nigeria &amp; Kenya
              </div>
              <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
                HR &amp; payroll built for how African businesses actually work.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
                Employees, payroll, leave, recruitment, and performance in one system - with the statutory
                rules for each country handled automatically instead of bolted on afterward.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Get started
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <DemoRequestDialog trigger={<Button size="lg" variant="outline">Book a demo</Button>} />
              </div>
            </div>
            <div className="lg:col-span-6">
              <ProductPreview />
            </div>
          </div>
        </section>

        {/* Country coverage - direct, substantive answer to "where do you
            operate," not just a badge: what payroll actually calculates in
            each market. */}
        <section id="countries" className="border-y border-border bg-muted/30 px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">Where we operate</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance">
                Payroll that already knows the rules in three markets
              </h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {COUNTRIES.map((country) => (
                <div key={country.name} className="rounded-xl border border-border bg-card p-6">
                  <span className="text-3xl" aria-hidden="true">
                    {country.flag}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{country.name}</h3>
                  <p className="text-sm text-muted-foreground">Paid in {country.currency}</p>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4">
                    {country.statutory.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features - a bordered list rather than a uniform icon-card grid,
            with the flagship module (Payroll) given more visual weight. */}
        <section id="features" className="px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">Features</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Everything HR needs, one system
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every module shares the same employee record, so nothing gets re-entered or falls out of sync.
              </p>
            </div>
            <div className="mt-12 overflow-hidden rounded-2xl border border-border">
              {FEATURES.map(({ icon: Icon, title, description }, index) => (
                <div
                  key={title}
                  className={`flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-6 sm:p-8 ${
                    index % 2 === 1 ? 'bg-muted/30' : 'bg-card'
                  } ${index !== 0 ? 'border-t border-border' : ''}`}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works - connected timeline instead of a plain 3-col grid. */}
        <section className="bg-muted/30 px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">How it works</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Up and running in three steps
              </h2>
            </div>
            <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-6">
              <div
                className="absolute top-5 right-0 left-0 hidden h-px bg-border sm:block"
                aria-hidden="true"
              />
              {STEPS.map((step) => (
                <div key={step.number} className="relative">
                  <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold text-primary">
                    {step.number}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security - two-column, breaking the centered-heading rhythm the
            other sections use. */}
        <section id="security" className="bg-primary px-4 py-20 text-primary-foreground lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="text-sm font-semibold tracking-wide uppercase opacity-80">Security</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Every tenant's data stays separate. Every action stays accountable.
              </h2>
            </div>
            <div className="space-y-8 lg:col-span-7">
              {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold">{title}</h3>
                    <p className="mt-1 text-sm text-primary-foreground/80">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 rounded-2xl border border-border bg-card p-10 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
                Ready to simplify HR &amp; payroll for your business?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Sign in to get your team set up in Ghana, Nigeria, or Kenya.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <DemoRequestDialog trigger={<Button size="lg" variant="outline">Book a demo</Button>} />
              <Button asChild size="lg">
                <Link href="/login">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-4 py-10 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Logo className="size-6 rounded-md" />
            <span className="text-sm font-medium">ParotHR</span>
          </div>
          <nav className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Login
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">&copy; {year} ParotHR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
