import { MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemoRequestDialog } from './demo-request-dialog';
import { MarketingHeader } from './marketing-header';
import { MarketingFooter } from './marketing-footer';

const REASONS = [
  {
    title: 'One system instead of five',
    description:
      'Teams that move to ParotHR consolidate payroll spreadsheets, a separate leave tracker, and a bank portal into one place, with one employee record driving all of it.',
  },
  {
    title: 'Payroll that gets the statutory math right',
    description:
      'SSNIT, PAYE, NSSF, and pension calculations are built into every pay run across the African markets we serve, so finance teams stop hand-checking deductions every cycle.',
  },
  {
    title: 'Self-service that actually reduces HR workload',
    description:
      'Employees request leave, enroll in benefits, and view their own payslips directly, instead of routing every request through HR.',
  },
];

export function TestimonialsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1">
        <section className="px-4 pt-16 pb-14 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Customer feedback</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              What businesses on ParotHR tell us
            </h1>
            <p className="mt-5 text-lg text-muted-foreground text-balance">
              We&apos;re early - customer testimonials will be published here as businesses come on board.
              In the meantime, here&apos;s what teams consistently ask ParotHR to fix for them.
            </p>
          </div>
        </section>

        <section className="border-y border-border bg-muted/30 px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {REASONS.map((reason) => (
                <div key={reason.title} className="rounded-xl border border-border bg-card p-6">
                  <h3 className="text-base font-semibold">{reason.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageSquareText className="size-6" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Already using ParotHR?</h2>
              <p className="mt-2 text-muted-foreground">
                We&apos;d like to hear how it&apos;s going. Email{' '}
                <a href="mailto:support@parothr.com" className="text-primary hover:underline">
                  support@parothr.com
                </a>{' '}
                with your feedback - with your permission, we may feature it here.
              </p>
            </div>
            <DemoRequestDialog trigger={<Button size="lg">Book a demo</Button>} />
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
