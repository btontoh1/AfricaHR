import { Mail, Phone, UserCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const CHANNELS = [
  {
    icon: Mail,
    label: 'Email (primary)',
    contact: 'support@parothr.com',
    href: 'mailto:support@parothr.com',
    use: 'All issues. Every email opens a tracked ticket with a reference number, so nothing is lost and history is kept.',
  },
  {
    icon: Phone,
    label: 'Phone & WhatsApp',
    contact: '+233 24 426 2347',
    href: 'tel:+233244262347',
    use: 'Urgent, payroll-blocking issues. Available during extended payroll-week hours.',
  },
  {
    icon: UserCheck,
    label: 'Named contact',
    contact: 'Assigned at onboarding',
    href: null,
    use: 'Your organization is given a named person who knows your configuration, not a general queue.',
  },
];

const RESPONSE_TARGETS = [
  {
    severity: 'P1',
    label: 'Critical',
    variant: 'destructive' as const,
    meaning: 'Payroll cannot be processed, or the platform is unavailable.',
    acknowledge: '2 working hours',
    then: 'Worked continuously; written update every 4 hours until resolved or a workaround is in place.',
  },
  {
    severity: 'P2',
    label: 'High',
    variant: 'warning' as const,
    meaning: 'A function is not working correctly, but a workaround exists.',
    acknowledge: '1 working day',
    then: 'Resolution targeted within 5 working days.',
  },
  {
    severity: 'P3',
    label: 'Normal',
    variant: 'secondary' as const,
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
    <div className="space-y-6">
      <PageHeader
        title="Help & Support"
        description="How to reach us, and what we commit to."
      />

      <Card>
        <CardHeader>
          <CardTitle>How to reach support</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {CHANNELS.map((channel) => (
            <div key={channel.label} className="flex gap-4">
              <channel.icon className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {channel.label} —{' '}
                  {channel.href ? (
                    <a href={channel.href} className="font-normal text-primary hover:underline">
                      {channel.contact}
                    </a>
                  ) : (
                    <span className="font-normal text-muted-foreground">{channel.contact}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{channel.use}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support hours</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Standard</p>
            <p className="mt-1 text-sm text-muted-foreground">Monday to Friday, 08:00 – 17:00 GMT</p>
            <p className="mt-1 text-xs text-muted-foreground">Excluding Ghana public holidays.</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm font-medium">Payroll week — 22nd to the last working day of each month</p>
            <p className="mt-1 text-sm text-muted-foreground">Monday to Saturday, 07:00 – 20:00 GMT</p>
          </div>
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Outside these hours, payroll-blocking issues reported by phone are triaged the same day.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Response targets</CardTitle>
          <CardDescription>
            Severity is assigned on receipt and confirmed with you. If you believe a ticket is mis-rated, say so and
            it is reviewed immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severity</TableHead>
                <TableHead>What it means</TableHead>
                <TableHead>We acknowledge within</TableHead>
                <TableHead>Then</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RESPONSE_TARGETS.map((row) => (
                <TableRow key={row.severity}>
                  <TableCell>
                    <Badge variant={row.variant}>
                      {row.severity} — {row.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-muted-foreground">{row.meaning}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{row.acknowledge}</TableCell>
                  <TableCell className="max-w-xs whitespace-normal text-muted-foreground">{row.then}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            If a P1 is not acknowledged within the stated time, or you are not satisfied with progress: escalate
            directly to <span className="font-medium text-foreground">Baffour Tontoh, Founder</span> — reachable on
            the number above and at{' '}
            <a href="mailto:support@parothr.com?subject=ESCALATION" className="text-primary hover:underline">
              support@parothr.com
            </a>{' '}
            marked <span className="font-medium text-foreground">ESCALATION</span> in the subject line. No ticket is
            closed without your confirmation.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What support covers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-x-8 gap-y-2 text-sm text-muted-foreground sm:grid-cols-2">
            {COVERED.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-primary">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statutory updates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            When Ghanaian payroll law changes — PAYE bands, SSNIT rates, pension rules — we update the platform and
            write to every affected client explaining what changed and what, if anything, they need to do. This is
            included at no additional cost, on every plan. You should never learn about a tax change from a penalty
            notice.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Planned maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Scheduled maintenance is notified at least 5 working days in advance, carried out outside 08:00–17:00
            GMT, and never between the 22nd and the last working day of a month. Emergency security patching may be
            applied without notice; you are informed within 24 hours of what was done and why.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
