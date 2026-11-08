import { Banknote, Globe2, ShieldCheck, Users } from 'lucide-react';
import { MarketingHeader } from './marketing-header';
import { MarketingFooter } from './marketing-footer';

const VALUES = [
  {
    icon: Globe2,
    title: 'Built for African payroll, not adapted to it',
    description:
      "Statutory rules - SSNIT in Ghana, PAYE and pension in Nigeria, NSSF in Kenya - are core to how ParotHR calculates a pay run, not a workaround bolted onto software built for another market.",
  },
  {
    icon: Users,
    title: 'One record, every module',
    description:
      'An employee is added once and the same record drives payroll, leave, performance, and recruitment - nothing gets re-entered or falls out of sync between spreadsheets.',
  },
  {
    icon: ShieldCheck,
    title: 'Security as a default, not an add-on',
    description:
      "Every customer's data is isolated at the database layer, every action is auditable, and multi-factor authentication is available on every account from day one.",
  },
  {
    icon: Banknote,
    title: 'Money moves accurately and on time',
    description:
      'Payroll disbursement is treated as the most consequential thing the product does - reconciled, retryable, and never silently dropped.',
  },
];

export function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1">
        <section className="px-4 pt-16 pb-14 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">About us</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              We build the HR and payroll system African businesses actually need.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              ParotHR is built and operated by Baffour &amp; Egyir Ringlife LTD, a company registered in
              Ghana. We started ParotHR because running payroll and HR across Africa usually means
              stitching together spreadsheets, bank portals, and software that treats statutory
              compliance as an afterthought.
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4 text-base text-muted-foreground">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Our mission</h2>
            <p>
              Give every business operating in Africa a single system for employees,
              payroll, leave, recruitment, and performance - with the statutory rules for each country
              handled correctly by default, so HR and finance teams can spend less time reconciling
              spreadsheets and more time running the business.
            </p>
            <h2 className="pt-4 text-2xl font-semibold tracking-tight text-foreground">What we do</h2>
            <p>
              ParotHR is a multi-tenant HR and payroll platform. Each customer's organization runs its own
              employee records, payroll cycles, leave policies, recruitment pipeline, and performance
              reviews inside a fully isolated tenant. Payroll runs are calculated in each country's own
              currency, statutory deductions are computed automatically, and payslip disbursement is
              handled through our payment partner - by bank transfer or mobile money, so employees who
              rely on mobile money for everyday transactions can be paid that way too. For businesses that
              invoice their own customers, ParotHR also generates branded invoice PDFs carrying your
              organization&apos;s own logo.
            </p>
          </div>
        </section>

        <section className="px-4 py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">What we stand for</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                The principles behind how we build ParotHR
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {VALUES.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-xl border border-border bg-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">Company details</h2>
            <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Registered company
                </dt>
                <dd className="mt-1 text-sm">Baffour &amp; Egyir Ringlife LTD</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Country</dt>
                <dd className="mt-1 text-sm">Ghana</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Registered address
                </dt>
                <dd className="mt-1 text-sm">10 Benin St. GC-000-6098, Ghana</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Support
                </dt>
                <dd className="mt-1 text-sm">
                  <a href="mailto:support@parothr.com" className="text-primary hover:underline">
                    support@parothr.com
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
