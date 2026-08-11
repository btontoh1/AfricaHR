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

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#security', label: 'Security' },
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
      'Run multi-currency pay cycles and pay employees directly to their bank accounts, built around African statutory requirements from day one.',
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
      'Bring your company structure in - one organization or several under a single account, each with its own admin if you need it.',
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

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-muted-foreground">{description}</p>}
    </div>
  );
}

// Hand-built preview of the product's own dashboard (mirrors
// apps/web/src/app/(app)/dashboard) rather than a real screenshot - keeps
// this page free of any real tenant's data while still showing accurately
// what signing in actually looks like.
function ProductPreview() {
  const bars = [38, 52, 46, 60, 71, 55, 64, 48, 58, 66, 50, 62];
  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft-lg">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
          <span className="size-2.5 rounded-full bg-destructive/60" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-warning/60" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-success/60" aria-hidden="true" />
          <span className="ml-3 text-xs text-muted-foreground">app.parothr.com/dashboard</span>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-background p-4 sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">Payroll cost trend</p>
            <div className="mt-4 flex h-32 items-end gap-2">
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
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">Employees</p>
              <p className="mt-1 text-2xl font-semibold">128</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">Open requisitions</p>
              <p className="mt-1 text-2xl font-semibold">4</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-xs font-medium text-muted-foreground">Pending leave</p>
              <p className="mt-1 text-2xl font-semibold">6</p>
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
            <Button asChild>
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden px-4 pt-16 pb-8 sm:pt-24 lg:px-8">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] opacity-40"
            style={{
              background: 'radial-gradient(60% 60% at 50% 0%, var(--color-primary) 0%, transparent 70%)',
              opacity: 0.08,
            }}
            aria-hidden="true"
          />
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-6xl">
              HR &amp; payroll, simplified for African businesses.
            </h1>
            <p className="mt-6 text-lg text-muted-foreground text-balance">
              ParotHR brings employees, payroll, leave, recruitment, and performance into one system - built
              around how African businesses and payroll law actually work, not bolted on afterward.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">See how it works</a>
              </Button>
            </div>
          </div>
          <ProductPreview />
        </section>

        <section id="features" className="px-4 py-24 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title="Everything HR needs, one system"
            description="Every module shares the same employee record, so nothing gets re-entered or falls out of sync."
          />
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-soft-sm">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="bg-muted/40 px-4 py-24 lg:px-8">
          <SectionHeading eyebrow="How it works" title="Up and running in three steps" />
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.number}>
                <span className="text-sm font-semibold text-primary">{step.number}</span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="bg-primary px-4 py-24 text-primary-foreground lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide uppercase opacity-80">Security</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Built to keep every tenant's data separate and every action accountable
            </h2>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-8 sm:grid-cols-3">
            {TRUST_POINTS.map(({ icon: Icon, title, description }) => (
              <div key={title} className="text-center sm:text-left">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-white/15 sm:mx-0">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-primary-foreground/80">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-10 text-center shadow-soft-lg">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Ready to simplify HR &amp; payroll for your business?
            </h2>
            <p className="mt-3 text-muted-foreground">Sign in to get your team set up, or ask us for a walkthrough.</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/login">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" />
                No spreadsheets
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" />
                Built for African payroll
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" />
                Role-based access down to one team
              </li>
            </ul>
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
