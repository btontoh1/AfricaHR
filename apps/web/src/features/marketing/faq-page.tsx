import { ChevronDown } from 'lucide-react';
import { MarketingHeader } from './marketing-header';
import { MarketingFooter } from './marketing-footer';

const FAQ_SECTIONS = [
  {
    heading: 'Getting started',
    items: [
      {
        question: 'Which countries does ParotHR support?',
        answer:
          "ParotHR is live in Ghana, Nigeria, and Kenya today. Payroll in each country is calculated in the local currency (GHS, NGN, KES) with that country's statutory deductions - SSNIT and PAYE in Ghana, PAYE with pension and NHIS in Nigeria, and NSSF with PAYE in Kenya - applied automatically.",
      },
      {
        question: 'How do I get set up?',
        answer:
          'Book a demo or request access from the homepage. Once your account is provisioned, you set up your organization, add your employees, and every module - payroll, leave, performance, recruitment - already has what it needs to run.',
      },
      {
        question: 'Can one account manage more than one company?',
        answer:
          'Yes. A single tenant can hold several organizations, each with its own admin if you need one, while payroll, employee records, and reporting stay scoped correctly to each organization.',
      },
    ],
  },
  {
    heading: 'Payroll & payments',
    items: [
      {
        question: 'How does payroll disbursement work?',
        answer:
          'Once a pay run is approved, ParotHR disburses payslip payments directly to employee bank accounts through our payment partner, Paystack. Every transfer is tracked to completion, and any failed or stuck disbursement is flagged for follow-up rather than silently dropped.',
      },
      {
        question: 'Who is allowed to approve or release a payroll run?',
        answer:
          "ParotHR supports separation of duties on payroll: a Payroll Officer role can prepare and process a pay run, while approving it and releasing payment is reserved for a Payroll Manager or Tenant Admin. You choose how strict that separation is for your team.",
      },
      {
        question: 'What happens if a statutory rate changes?',
        answer:
          'Statutory reference data - tax bands, SSNIT/NSSF rates, and similar figures - is maintained centrally and kept current, so a rate change is reflected in your next pay run without you having to update anything yourself.',
      },
    ],
  },
  {
    heading: 'Security & access',
    items: [
      {
        question: 'How is my company’s data kept separate from other customers?',
        answer:
          "Every tenant's data is isolated at the database layer using row-level security, not just filtered in application code. One tenant's employees, payroll records, and documents are never reachable from another tenant's account.",
      },
      {
        question: 'Can I control what each person on my team can see or do?',
        answer:
          'Yes. Access is role-based, from a platform-wide administrator down to an admin managing a single organization’s employees. Roles like HR Manager, Payroll Manager, Payroll Officer, and Organization Admin each get exactly the permissions that role needs, nothing more.',
      },
      {
        question: 'Is multi-factor authentication available?',
        answer:
          'Yes, MFA is available on every account, and every sensitive change made in the system is recorded in an audit trail of who did what and when.',
      },
    ],
  },
  {
    heading: 'Billing & support',
    items: [
      {
        question: 'How does billing work?',
        answer:
          'ParotHR is billed as a subscription. See our Refund & Cancellation Policy for details on billing cycles, cancellation, and refund eligibility.',
      },
      {
        question: 'How do I get help if something goes wrong?',
        answer: (
          <>
            Email{' '}
            <a href="mailto:support@parothr.com" className="text-primary hover:underline">
              support@parothr.com
            </a>{' '}
            and our team will get back to you. If you’re a platform administrator, in-app notifications
            also surface delivery failures and stuck payroll disbursements as they happen.
          </>
        ),
      },
    ],
  },
];

export function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1 px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">FAQ</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">Frequently asked questions</h1>
          <p className="mt-4 text-muted-foreground">
            Can&apos;t find what you&apos;re looking for? Email{' '}
            <a href="mailto:support@parothr.com" className="text-primary hover:underline">
              support@parothr.com
            </a>
            .
          </p>

          <div className="mt-10 space-y-10">
            {FAQ_SECTIONS.map((section) => (
              <div key={section.heading}>
                <h2 className="text-lg font-semibold">{section.heading}</h2>
                <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                  {section.items.map((item) => (
                    <details key={item.question} className="group p-5 open:pb-5">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium marker:content-none">
                        {item.question}
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 text-sm text-muted-foreground">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
