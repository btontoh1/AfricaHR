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
  LineChart,
  Coins,
  Scale,
  Rows3,
  BookText,
  Layers,
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
  Truck,
  FileMinus2,
  PiggyBank,
  GitCompare,
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
  // Read-only, Finance-only - an external bookkeeper with no other
  // tenant-admin capability and (usually) no Employee record. Excluded from
  // hasAdminAccess below the same way isOrgAdmin is, since that check is
  // exclusion-based (role !== EMPLOYEE) and would otherwise treat a brand
  // new role as admin-ish by default.
  const isAccountant = user.role === 'ACCOUNTANT';
  // ORG_ADMIN and ACCOUNTANT are deliberately excluded from the tenant-wide
  // admin surface (Organizations, Team Members, Payroll, Reports, ...) -
  // ORG_ADMIN only gets Employees scoped to its own organization (see
  // hasEmployeesAccess), and ACCOUNTANT only gets Finance (see
  // hasFinanceAccess below).
  const hasAdminAccess = isTenantMember && user.role !== 'EMPLOYEE' && !isOrgAdmin && !isAccountant;
  // General ledger reports (FINANCE_READ) are TENANT_ADMIN/ACCOUNTANT-only -
  // unlike most of the "Reports" group, HR_MANAGER/PAYROLL_MANAGER/
  // PAYROLL_OFFICER don't hold this permission (see system-role.ts), so
  // hasAdminAccess alone would be too broad here. Also gated behind the
  // tenant's paid FINANCE add-on (see AddOnGuard) - role alone isn't enough,
  // same enforcement the backend applies on FinanceController.
  const hasFinanceAccess =
    isTenantMember && (user.role === 'TENANT_ADMIN' || isAccountant) && enabledAddOns.includes('FINANCE');
  // Self-service items assume an Employee record (payslips, benefits, leave
  // balance, ...) - an Accountant typically has none (see UserService.create),
  // so it's excluded from these even though it's otherwise a tenant member.
  // Notifications/My Account stay isTenantMember-only below since those are
  // generic account features, not Employee-linked data.
  const isEmployeeSelfService = isTenantMember && !isAccountant;
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
  // Accounts Payable (vendor bills) - the AP mirror of hasInvoicingAccess,
  // same role distribution (see Permission.AP_MANAGE/AP_READ). Gated behind
  // the FINANCE add-on rather than its own toggle - it's presented as part
  // of the finance suite alongside Journal Entries/Chart of Accounts, not a
  // separate purchase, and its postings land in the same GL either way.
  const hasApAccess =
    isTenantMember &&
    (user.role === 'TENANT_ADMIN' || user.role === 'HR_MANAGER' || isOrgAdmin) &&
    enabledAddOns.includes('FINANCE');
  // Unlike INVOICING, these gate an entire nav group (including the
  // self-service items every tenant member would otherwise see
  // unconditionally, e.g. "My Goals"/"My Requisitions") since the backend
  // now blocks those routes too when the add-on is off for the tenant -
  // see RequireAddOn on the *-feature controllers.
  const hasPerformanceAddOn = enabledAddOns.includes('PERFORMANCE');
  const hasRecruitmentAddOn = enabledAddOns.includes('RECRUITMENT');

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
        ...(isEmployeeSelfService ? [{ label: 'Leave', href: '/leave', icon: CalendarDays }] : []),
        ...(hasLeaveAdminAccess
          ? [{ label: 'Leave Requests', href: '/leave/requests', icon: ClipboardCheck }]
          : []),
        // Direct-manager tier, visible to every tenant member same as Team
        // Reviews — a dynamic Employee.managerId relationship, not a role
        // permission (see TeamLeaveRequestController).
        ...(isEmployeeSelfService
          ? [{ label: 'Team Leave Requests', href: '/leave/requests/team', icon: Users2 }]
          : []),
        ...(hasLeaveAdminAccess
          ? [{ label: 'Leave Types', href: '/leave/types', icon: ListTree }]
          : []),
        ...(isEmployeeSelfService ? [{ label: 'Attendance', href: '/attendance', icon: Clock }] : []),
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
        ...(isEmployeeSelfService ? [{ label: 'My Payslips', href: '/payslips', icon: Receipt }] : []),
        ...(isEmployeeSelfService
          ? [{ label: 'Payment Details', href: '/payment-method', icon: Landmark }]
          : []),
        ...(isEmployeeSelfService
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
      label: 'Accounts Payable',
      items: [
        ...(hasApAccess ? [{ label: 'Vendors', href: '/vendors', icon: Truck }] : []),
        ...(hasApAccess ? [{ label: 'Bills', href: '/vendor-bills', icon: FileMinus2 }] : []),
      ],
    },
    {
      label: 'Finance',
      items: [
        ...(hasFinanceAccess
          ? [{ label: 'Journal Entries', href: '/finance/journal-entries', icon: BookText }]
          : []),
        ...(hasFinanceAccess
          ? [{ label: 'Chart of Accounts', href: '/finance/accounts', icon: Layers }]
          : []),
        ...(hasFinanceAccess ? [{ label: 'Budgets', href: '/finance/budgets', icon: PiggyBank }] : []),
      ],
    },
    {
      label: 'Performance',
      items: !hasPerformanceAddOn
        ? []
        : [
            ...(isEmployeeSelfService
              ? [{ label: 'My Goals', href: '/performance/goals', icon: Target }]
              : []),
            ...(hasPerformanceAdminAccess
              ? [{ label: 'All Goals', href: '/performance/goals/all', icon: ClipboardList }]
              : []),
            ...(isEmployeeSelfService
              ? [{ label: 'My Reviews', href: '/performance/reviews', icon: FileText }]
              : []),
            // Visible to every tenant member: manager-ness is a dynamic
            // per-employee relationship, not a role permission.
            ...(isEmployeeSelfService
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
      items: !hasRecruitmentAddOn
        ? []
        : [
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
            ...(isEmployeeSelfService
              ? [
                  {
                    label: 'My Requisitions',
                    href: '/recruitment/requisitions/mine',
                    icon: Briefcase,
                  },
                ]
              : []),
            ...(isEmployeeSelfService
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
        ...(hasFinanceAccess
          ? [{ label: 'Profit and Loss', href: '/reports/profit-and-loss', icon: LineChart }]
          : []),
        ...(hasFinanceAccess
          ? [{ label: 'Cash Flow', href: '/reports/cash-flow', icon: Coins }]
          : []),
        ...(hasFinanceAccess
          ? [{ label: 'Balance Sheet', href: '/reports/balance-sheet', icon: Scale }]
          : []),
        ...(hasFinanceAccess
          ? [{ label: 'Trial Balance', href: '/reports/trial-balance', icon: Rows3 }]
          : []),
        ...(hasFinanceAccess
          ? [{ label: 'Budget vs Actual', href: '/reports/budget-vs-actual', icon: GitCompare }]
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
