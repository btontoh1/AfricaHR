'use client';

import Link from 'next/link';
import {
  Users,
  Wallet,
  Clock,
  Briefcase,
  CalendarDays,
  Target,
  FileText,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { useSession } from '../session-provider';
import {
  useHeadcountReport,
  usePayrollCostReport,
  useAttendanceReport,
  useRecruitmentPipelineReport,
} from '@/features/reporting/queries';
import { getDefaultDateRange } from '@/features/reporting/date-range';
import { StatCard } from '@/features/reporting/stat-card';
import { CardSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { getApiErrorMessage } from '@/lib/api-error';
import { Card, CardContent } from '@/components/ui/card';

const quickLinks = [
  { label: 'Leave', href: '/leave', icon: CalendarDays },
  { label: 'Attendance', href: '/attendance', icon: Clock },
  { label: 'My Goals', href: '/performance/goals', icon: Target },
  { label: 'My Reviews', href: '/performance/reviews', icon: FileText },
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

function Greeting({ email }: { email: string }) {
  const name = email.split('@')[0];
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight capitalize">Welcome back, {name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening across your workspace.</p>
    </div>
  );
}

function QuickLinks() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {quickLinks.map(({ label, href, icon: Icon }) => (
        <Link key={href} href={href}>
          <Card className="transition-shadow hover:shadow-soft-lg">
            <CardContent className="flex flex-col items-center gap-2 py-4 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function AdminOverview({ tenantId }: { tenantId: string }) {
  const { from, to } = getDefaultDateRange();
  const headcount = useHeadcountReport(tenantId);
  const payrollCost = usePayrollCostReport(tenantId, { from, to });
  const attendance = useAttendanceReport(tenantId, { from, to });
  const recruitment = useRecruitmentPipelineReport(tenantId);

  const queries = [headcount, payrollCost, attendance, recruitment];
  const isLoading = queries.some((q) => q.isLoading);
  const firstError = queries.find((q) => q.isError);

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (firstError) {
    return <ErrorState message={getApiErrorMessage(firstError.error, 'Failed to load dashboard data')} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active employees" value={headcount.data?.activeCount ?? '—'} icon={Users} />
        <StatCard
          label="Net pay (30d)"
          value={payrollCost.data ? payrollCost.data.totalNetPay.toLocaleString() : '—'}
          icon={Wallet}
        />
        <StatCard
          label="Hours worked (30d)"
          value={attendance.data ? attendance.data.totalHoursWorked.toLocaleString() : '—'}
          icon={Clock}
        />
        <StatCard label="Open requisitions" value={recruitment.data?.openRequisitions ?? '—'} icon={Briefcase} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <Link href="/reports/headcount" className="inline-flex items-center gap-1 text-primary hover:underline">
          View all reports <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const session = useSession();
  const isTenantMember = Boolean(session.tenantId);
  const hasAdminAccess = isTenantMember && session.role !== 'EMPLOYEE';

  return (
    <div className="space-y-8">
      <Greeting email={session.email} />
      {hasAdminAccess && session.tenantId && <AdminOverview tenantId={session.tenantId} />}
      {/* Every quick link below is a self-service page gated on tenant
          membership - a PLATFORM_ADMIN (no tenant) has nothing to self-serve
          here, same as it had nothing on the pre-redesign placeholder. */}
      {isTenantMember && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick links</h2>
          <QuickLinks />
        </div>
      )}
    </div>
  );
}
