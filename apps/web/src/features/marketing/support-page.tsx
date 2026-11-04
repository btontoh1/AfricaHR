import { Mail, Phone, UserCheck } from 'lucide-react';
import { MarketingHeader } from './marketing-header';
import { MarketingFooter } from './marketing-footer';

const CHANNELS = [
  {
    icon: Mail,
    label: 'Email (primary)',
    contact: 'support@parothr.com',
    use: 'All issues. Every email opens a tracked ticket with a reference number, so nothing is lost and history is kept.',
  },
  {
    icon: Phone,
    label: 'Phone & WhatsApp',
    contact: '+233 24 426 2347',
    use: 'Urgent, payroll-blocking issues. Available during extended payroll-week hours.',
  },
  {
    icon: UserCheck,
    label: 'Named contact',
    contact: 'Assigned at onboarding',
    use: 'Your organization is given a named person who knows your configuration, not a general queue.',
  },
];

const RESPONSE_TARGETS = [
  {
    severity: 'P1 — Critical',
    meaning: 'Payroll cannot be processed, or the platform is unavailable.',
    acknowledge: '2 working hours',
    then: 'Worked continuously; written update every 4 hours until resolved or a workaround is in place.',
  },
  {
    severity: 'P2 — High',
    meaning: 'A function is not working correctly, but a workaround exists.',
    acknowledge: '1 working day',
    then: 'Resolution targeted within 5 working days.',
  },
  {
    severity: 'P3 — Normal',
    meaning: 'Questions, configuration help, reports, change requests.',
    acknowledge: '2 working days',
    then: 'Scheduled and confirmed with you.',
  },
];

const COVERED = [
  'Configuration and setup questions',
  'Payroll run assistance and review',
  'Correcting platform errors and defects',
  'Data import and migration help',
  'Report and payslip queries',
  'User access and permission changes',
  'Refresher training for new HR staff',
  'Guidance on statutory filings in the platform',
];

export function SupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <main className="flex-1 px-4 py-16 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Support</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">Support &amp; Service Commitment</h1>
          <p className="mt-4 text-muted-foreground">How client organizations reach us, and what we commit to.</p>

          <div className="mt-10 space-y-10">
            <section>
              <h2 className="text-lg font-semibold">How to reach support</h2>
              <div className="mt-4 divide-y divide-border rounded-xl border border-border">
                {CHANNELS.map((channel) => (
                  <div key={channel.label} className="flex gap-4 p-5">
                    <channel.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {channel.label} — <span className="font-normal text-muted-foreground">{channel.contact}</span>
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{channel.use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Support hours</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-5">
                  <p className="text-sm font-medium">Standard</p>
                  <p className="mt-1 text-sm text-muted-foreground">Monday to Friday, 08:00 – 17:00 GMT</p>
                  <p className="mt-1 text-xs text-muted-foreground">Excluding Ghana public holidays.</p>
                </div>
                <div className="rounded-xl border border-border p-5">
                  <p className="text-sm font-medium">Payroll week — 22nd to the last working day of each month</p>
                  <p className="mt-1 text-sm text-muted-foreground">Monday to Saturday, 07:00 – 20:00 GMT</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Outside these hours, payroll-blocking issues reported by phone are triaged the same day.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Response targets</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-4 font-medium">Severity</th>
                      <th className="p-4 font-medium">What it means</th>
                      <th className="p-4 font-medium">We acknowledge within</th>
                      <th className="p-4 font-medium">Then</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {RESPONSE_TARGETS.map((row) => (
                      <tr key={row.severity}>
                        <td className="p-4 align-top font-medium whitespace-nowrap">{row.severity}</td>
                        <td className="p-4 align-top text-muted-foreground">{row.meaning}</td>
                        <td className="p-4 align-top text-muted-foreground whitespace-nowrap">{row.acknowledge}</td>
                        <td className="p-4 align-top text-muted-foreground">{row.then}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Severity is assigned on receipt and confirmed with you. If you believe a ticket is mis-rated, say so
                and it is reviewed immediately.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Escalation</h2>
              <p className="mt-4 text-sm text-muted-foreground">
                If a P1 is not acknowledged within the stated time, or you are not satisfied with progress: escalate
                directly to <span className="font-medium text-foreground">Baffour Tontoh, Founder</span> — reachable
                on the number above and at{' '}
                <a href="mailto:support@parothr.com" className="text-primary hover:underline">
                  support@parothr.com
                </a>{' '}
                marked <span className="font-medium text-foreground">ESCALATION</span> in the subject line. No ticket
                is closed without your confirmation.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">What support covers</h2>
              <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
                {COVERED.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-primary">
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-border bg-muted/30 p-5">
              <h2 className="text-lg font-semibold">Statutory updates</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                When Ghanaian payroll law changes — PAYE bands, SSNIT rates, pension rules — we update the platform
                and write to every affected client explaining what changed and what, if anything, they need to do.
                This is included at no additional cost, on every plan. You should never learn about a tax change from
                a penalty notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold">Planned maintenance</h2>
              <p className="mt-4 text-sm text-muted-foreground">
                Scheduled maintenance is notified at least 5 working days in advance, carried out outside 08:00–17:00
                GMT, and never between the 22nd and the last working day of a month. Emergency security patching may
                be applied without notice; you are informed within 24 hours of what was done and why.
              </p>
            </section>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
