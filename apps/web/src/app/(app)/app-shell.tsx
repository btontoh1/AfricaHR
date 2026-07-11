'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SessionUser } from '@/lib/session';

export function AppShell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const initials = user.email.slice(0, 2).toUpperCase();

  // Coarse, cheap client-side visibility checks only — the backend remains
  // the real enforcement point (see project notes on Module 2 scope).
  // PLATFORM_ADMIN has no tenant context (tenantId always null) and no
  // linked Employee record, so it's excluded from every tenant-scoped
  // item including self-service leave. EMPLOYEE holds no Employee/
  // Organization permission at all, but self-service leave has no
  // permission gate — it's for every tenant member, EMPLOYEE included.
  const isTenantMember = Boolean(user.tenantId);
  const hasAdminAccess = isTenantMember && user.role !== 'EMPLOYEE';
  // PAYROLL_MANAGER is admin-ish but doesn't hold LEAVE_READ/LEAVE_MANAGE
  // (see system-role.ts) — narrower than hasAdminAccess on purpose.
  const hasLeaveAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  // ATTENDANCE_READ/MANAGE are wired to the same roles as LEAVE_READ/MANAGE
  // (PLATFORM_ADMIN/TENANT_ADMIN/HR_MANAGER) — PAYROLL_MANAGER is excluded
  // here too, same reasoning as hasLeaveAdminAccess above.
  const hasAttendanceAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  // BENEFITS_READ/MANAGE are wired the same way — PAYROLL_MANAGER excluded.
  const hasBenefitsAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  // PERFORMANCE_READ/MANAGE are wired the same way — PAYROLL_MANAGER excluded.
  const hasPerformanceAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  // RECRUITMENT_READ/MANAGE are wired the same way — PAYROLL_MANAGER excluded.
  const hasRecruitmentAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  const navItems = [
    { label: 'Dashboard', href: '/dashboard' },
    ...(hasAdminAccess ? [{ label: 'Employees', href: '/employees' }] : []),
    ...(hasAdminAccess ? [{ label: 'Organizations', href: '/organizations' }] : []),
    // TENANT_ADMIN, HR_MANAGER, and PAYROLL_MANAGER all hold PAYROLL_READ
    // (HR_MANAGER read-only, the other two also MANAGE) — hasAdminAccess
    // happens to match this module's real permission boundary exactly,
    // unlike Leave's narrower check just above.
    ...(hasAdminAccess ? [{ label: 'Payroll', href: '/payroll' }] : []),
    ...(isTenantMember ? [{ label: 'Leave', href: '/leave' }] : []),
    ...(hasLeaveAdminAccess ? [{ label: 'Leave Requests', href: '/leave/requests' }] : []),
    ...(hasLeaveAdminAccess ? [{ label: 'Leave Types', href: '/leave/types' }] : []),
    ...(isTenantMember ? [{ label: 'Attendance', href: '/attendance' }] : []),
    ...(hasAttendanceAdminAccess
      ? [{ label: 'Attendance Records', href: '/attendance/records' }]
      : []),
    ...(hasAttendanceAdminAccess
      ? [{ label: 'Attendance Policy', href: '/attendance/policy' }]
      : []),
    ...(isTenantMember ? [{ label: 'Benefits', href: '/benefits' }] : []),
    ...(hasBenefitsAdminAccess ? [{ label: 'Benefit Plans', href: '/benefits/plans' }] : []),
    ...(hasBenefitsAdminAccess
      ? [{ label: 'Benefit Enrollments', href: '/benefits/enrollments' }]
      : []),
    ...(isTenantMember ? [{ label: 'My Goals', href: '/performance/goals' }] : []),
    ...(isTenantMember ? [{ label: 'My Reviews', href: '/performance/reviews' }] : []),
    // Visible to every tenant member, not just admins: manager-ness is a
    // dynamic per-employee relationship (Employee.managerId), not a role
    // permission — anyone could be someone's direct manager. Empty for
    // non-managers, same as self-service leave being empty with no
    // requests yet.
    ...(isTenantMember ? [{ label: 'Team Reviews', href: '/performance/reviews/team' }] : []),
    ...(hasPerformanceAdminAccess
      ? [{ label: 'Review Cycles', href: '/performance/cycles' }]
      : []),
    ...(hasPerformanceAdminAccess
      ? [{ label: 'All Reviews', href: '/performance/reviews/all' }]
      : []),
    ...(hasRecruitmentAdminAccess
      ? [{ label: 'Requisitions', href: '/recruitment/requisitions' }]
      : []),
    ...(hasRecruitmentAdminAccess
      ? [{ label: 'Candidates', href: '/recruitment/candidates' }]
      : []),
    ...(hasRecruitmentAdminAccess
      ? [{ label: 'Applications', href: '/recruitment/applications' }]
      : []),
    // Hiring-manager tier, visible to every tenant member same as Team
    // Reviews — being a hiring manager is a dynamic JobRequisition.
    // hiringManagerId relationship, not a role permission.
    ...(isTenantMember
      ? [{ label: 'My Requisitions', href: '/recruitment/requisitions/mine' }]
      : []),
    ...(isTenantMember
      ? [{ label: 'My Applications', href: '/recruitment/applications/mine' }]
      : []),
    // REPORTING_READ is held by TENANT_ADMIN/HR_MANAGER/PAYROLL_MANAGER —
    // hasAdminAccess (not EMPLOYEE) matches this module's real permission
    // boundary exactly, same as Payroll's nav check, unlike the narrower
    // TENANT_ADMIN/HR_MANAGER-only checks used everywhere else this
    // session — PAYROLL_MANAGER holds REPORTING_READ for all five reports,
    // not just payroll-cost (a single permission, no per-report split).
    ...(hasAdminAccess ? [{ label: 'Headcount Report', href: '/reports/headcount' }] : []),
    ...(hasAdminAccess ? [{ label: 'Payroll Cost Report', href: '/reports/payroll-cost' }] : []),
    ...(hasAdminAccess
      ? [{ label: 'Leave Utilization Report', href: '/reports/leave-utilization' }]
      : []),
    ...(hasAdminAccess ? [{ label: 'Attendance Report', href: '/reports/attendance' }] : []),
    ...(hasAdminAccess
      ? [{ label: 'Recruitment Pipeline Report', href: '/reports/recruitment-pipeline' }]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/20 p-4">
        <div className="mb-6 text-lg font-semibold">AfricaHR</div>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="text-sm text-muted-foreground">
            {user.tenantId ? `Tenant: ${user.tenantId}` : 'Platform Admin'}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.role}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
