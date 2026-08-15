import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  CalendarDays,
  ClipboardCheck,
  ListTree,
  Clock,
  History,
  Settings2,
  Banknote,
  Receipt,
  Landmark,
  HeartHandshake,
  FileStack,
  FileCheck2,
  Target,
  FileText,
  Users2,
  RefreshCw,
  ClipboardList,
  Briefcase,
  UserSearch,
  FileInput,
  BarChart3,
  Wallet,
  CalendarRange,
  TrendingUp,
  Bell,
  FileCode,
  Send,
  ShieldCheck,
  Settings,
  Building,
  KeyRound,
  ScrollText,
  Presentation,
  Contact,
  PlayCircle,
} from 'lucide-react';
import type { SessionUser } from '@/lib/session';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Every condition below is copied verbatim from the pre-redesign app-shell
 * (same booleans, same roles, same reasoning) - this file only changes how
 * the data is organized (grouped, with icons) for presentation, not who
 * sees what. See each comment for the permission-matrix nuance it encodes.
 *
 * Coarse, cheap client-side visibility checks only - the backend remains
 * the real enforcement point.
 */
export function buildNavGroups(user: SessionUser, enabledAddOns: string[] = []): NavGroup[] {
  const isTenantMember = Boolean(user.tenantId);
  const isPlatformAdmin = user.role === 'PLATFORM_ADMIN';
  const isOrgAdmin = user.role === 'ORG_ADMIN';
  // ORG_ADMIN is deliberately excluded from the tenant-wide admin surface
  // (Organizations, Team Members, Payroll, Reports, ...) - it only gets
  // Employees, scoped to its own organization (see hasEmployeesAccess).
  const hasAdminAccess = isTenantMember && user.role !== 'EMPLOYEE' && !isOrgAdmin;
  const hasEmployeesAccess = hasAdminAccess || isOrgAdmin;
  // PAYROLL_MANAGER is admin-ish but doesn't hold LEAVE_READ/LEAVE_MANAGE.
  const hasLeaveAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  const hasAttendanceAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  const hasBenefitsAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  const hasPerformanceAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  const hasRecruitmentAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  const hasNotificationsAdminAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  // HR_MANAGER only holds USER_READ (not MANAGE); PAYROLL_MANAGER holds neither.
  const hasTeamMembersReadAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER');
  // Invoicing is an exception to ORG_ADMIN's otherwise employee-only scope -
  // it's the organization's own external billing tool, not an internal HR
  // function, so ORG_ADMIN gets it too (see Permission.INVOICING_MANAGE).
  // Also gated behind the tenant's paid INVOICING add-on (see AddOnGuard) -
  // role alone isn't enough, same enforcement the backend applies.
  const hasInvoicingAccess =
    isTenantMember &&
    (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER' || isOrgAdmin) &&
    enabledAddOns.includes('INVOICING');

  const groups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        // Every authenticated user sees this regardless of role or tenant
        // membership, same as "My Account" below - it's platform-wide
        // reference content curated by PLATFORM_ADMIN, not gated by role.
        { label: 'How it works', href: '/how-it-works', icon: PlayCircle },
      ],
    },
    {
      label: 'Platform Admin',
      items: [
        ...(isPlatformAdmin
          ? [{ label: 'Tenants', href: '/platform-admin/tenants', icon: Building }]
          : []),
        ...(isPlatformAdmin
          ? [{ label: 'Verification Queue', href: '/organizations/verification-queue', icon: ShieldCheck }]
          : []),
        ...(isPlatformAdmin
          ? [{ label: 'Audit Log', href: '/platform-admin/audit-logs', icon: ScrollText }]
          : []),
        ...(isPlatformAdmin
          ? [{ label: 'Demo Requests', href: '/platform-admin/demo-requests', icon: Presentation }]
          : []),
      ],
    },
    {
      label: 'People',
      items: [
        ...(hasEmployeesAccess ? [{ label: 'Employees', href: '/employees', icon: Users }] : []),
        ...(hasAdminAccess
          ? [{ label: 'Organizations', href: '/organizations', icon: Building2 }]
          : []),
        ...(hasTeamMembersReadAccess
          ? [{ label: 'Team Members', href: '/team-members', icon: UserCog }]
          : []),
      ],
    },
    {
      label: 'Time & Leave',
      items: [
        ...(isTenantMember ? [{ label: 'Leave', href: '/leave', icon: CalendarDays }] : []),
        ...(hasLeaveAdminAccess
          ? [{ label: 'Leave Requests', href: '/leave/requests', icon: ClipboardCheck }]
          : []),
        // Direct-manager tier, visible to every tenant member same as Team
        // Reviews — a dynamic Employee.managerId relationship, not a role
        // permission (see TeamLeaveRequestController).
        ...(isTenantMember
          ? [{ label: 'Team Leave Requests', href: '/leave/requests/team', icon: Users2 }]
          : []),
        ...(hasLeaveAdminAccess
          ? [{ label: 'Leave Types', href: '/leave/types', icon: ListTree }]
          : []),
        ...(isTenantMember ? [{ label: 'Attendance', href: '/attendance', icon: Clock }] : []),
        ...(hasAttendanceAdminAccess
          ? [{ label: 'Attendance Records', href: '/attendance/records', icon: History }]
          : []),
        ...(hasAttendanceAdminAccess
          ? [{ label: 'Attendance Policy', href: '/attendance/policy', icon: Settings2 }]
          : []),
      ],
    },
    {
      label: 'Payroll & Benefits',
      items: [
        ...(hasAdminAccess ? [{ label: 'Payroll', href: '/payroll', icon: Banknote }] : []),
        ...(isTenantMember ? [{ label: 'My Payslips', href: '/payslips', icon: Receipt }] : []),
        ...(isTenantMember
          ? [{ label: 'Payment Details', href: '/payment-method', icon: Landmark }]
          : []),
        ...(isTenantMember
          ? [{ label: 'Benefits', href: '/benefits', icon: HeartHandshake }]
          : []),
        ...(hasBenefitsAdminAccess
          ? [{ label: 'Benefit Plans', href: '/benefits/plans', icon: FileStack }]
          : []),
        ...(hasBenefitsAdminAccess
          ? [{ label: 'Benefit Enrollments', href: '/benefits/enrollments', icon: FileCheck2 }]
          : []),
      ],
    },
    {
      label: 'Invoicing',
      items: [
        ...(hasInvoicingAccess ? [{ label: 'Customers', href: '/customers', icon: Contact }] : []),
        ...(hasInvoicingAccess ? [{ label: 'Invoices', href: '/invoices', icon: Receipt }] : []),
      ],
    },
    {
      label: 'Performance',
      items: [
        ...(isTenantMember
          ? [{ label: 'My Goals', href: '/performance/goals', icon: Target }]
          : []),
        ...(hasPerformanceAdminAccess
          ? [{ label: 'All Goals', href: '/performance/goals/all', icon: ClipboardList }]
          : []),
        ...(isTenantMember
          ? [{ label: 'My Reviews', href: '/performance/reviews', icon: FileText }]
          : []),
        // Visible to every tenant member: manager-ness is a dynamic
        // per-employee relationship, not a role permission.
        ...(isTenantMember
          ? [{ label: 'Team Reviews', href: '/performance/reviews/team', icon: Users2 }]
          : []),
        ...(hasPerformanceAdminAccess
          ? [{ label: 'Review Cycles', href: '/performance/cycles', icon: RefreshCw }]
          : []),
        ...(hasPerformanceAdminAccess
          ? [{ label: 'All Reviews', href: '/performance/reviews/all', icon: ClipboardList }]
          : []),
      ],
    },
    {
      label: 'Recruitment',
      items: [
        ...(hasRecruitmentAdminAccess
          ? [{ label: 'Requisitions', href: '/recruitment/requisitions', icon: Briefcase }]
          : []),
        ...(hasRecruitmentAdminAccess
          ? [{ label: 'Candidates', href: '/recruitment/candidates', icon: UserSearch }]
          : []),
        ...(hasRecruitmentAdminAccess
          ? [{ label: 'Applications', href: '/recruitment/applications', icon: FileInput }]
          : []),
        // Hiring-manager tier, visible to every tenant member same as Team
        // Reviews - a dynamic JobRequisition.hiringManagerId relationship.
        ...(isTenantMember
          ? [
              {
                label: 'My Requisitions',
                href: '/recruitment/requisitions/mine',
                icon: Briefcase,
              },
            ]
          : []),
        ...(isTenantMember
          ? [{ label: 'My Applications', href: '/recruitment/applications/mine', icon: FileInput }]
          : []),
      ],
    },
    {
      label: 'Reports',
      items: [
        ...(hasAdminAccess
          ? [{ label: 'Headcount', href: '/reports/headcount', icon: BarChart3 }]
          : []),
        ...(hasAdminAccess
          ? [{ label: 'Payroll Cost', href: '/reports/payroll-cost', icon: Wallet }]
          : []),
        ...(hasAdminAccess
          ? [{ label: 'Leave Utilization', href: '/reports/leave-utilization', icon: CalendarRange }]
          : []),
        ...(hasAdminAccess
          ? [{ label: 'Attendance', href: '/reports/attendance', icon: Clock }]
          : []),
        ...(hasAdminAccess
          ? [
              {
                label: 'Recruitment Pipeline',
                href: '/reports/recruitment-pipeline',
                icon: TrendingUp,
              },
            ]
          : []),
      ],
    },
    {
      label: 'Notifications',
      items: [
        ...(isTenantMember
          ? [{ label: 'Notifications', href: '/notifications', icon: Bell }]
          : []),
        ...(hasNotificationsAdminAccess
          ? [{ label: 'Templates', href: '/notifications/templates', icon: FileCode }]
          : []),
        ...(hasNotificationsAdminAccess
          ? [{ label: 'Send Notification', href: '/notifications/send', icon: Send }]
          : []),
      ],
    },
    {
      label: 'Settings',
      items: [
        // Every authenticated user manages their own password and MFA
        // regardless of role or tenant membership - unlike the tenant-wide
        // Settings page below (sign-in link, logo), this isn't admin-gated.
        { label: 'My Account', href: '/account', icon: KeyRound },
        ...(user.role === 'TENANT_ADMIN'
          ? [{ label: 'Settings', href: '/settings', icon: Settings }]
          : []),
      ],
    },
  ];

  return groups.filter((group) => group.items.length > 0);
}
