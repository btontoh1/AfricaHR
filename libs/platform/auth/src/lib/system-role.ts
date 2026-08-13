// Plain string-union (not a TS `enum`), same reasoning as
// @africahr/tenancy-domain's TenantStatus: stays structurally interchangeable
// with Prisma's generated SystemRole type without casts at the boundary.
export const SystemRole = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  PAYROLL_MANAGER: 'PAYROLL_MANAGER',
  // Scoped to exactly one Organization within the tenant (User.organizationId)
  // - see assertOrganizationScope. Every other role here is tenant-wide.
  ORG_ADMIN: 'ORG_ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

// Fixed, code-defined catalog. Tenants pick from the roles above; they
// cannot invent new permissions or roles (see project memory for why this
// was chosen over dynamic per-tenant RBAC — a deliberate v1 scope cut).
export const Permission = {
  PLATFORM_TENANT_MANAGE: 'platform:tenant:manage',
  ORGANIZATION_MANAGE: 'organization:manage',
  // Added when Organization got its first read-only consumer (the
  // Employee frontend's organization picker) — Module 1 predates the
  // MANAGE/READ pairing every later module follows, so this was missing
  // until then. See project memory.
  ORGANIZATION_READ: 'organization:read',
  USER_MANAGE: 'user:manage',
  USER_READ: 'user:read',
  EMPLOYEE_MANAGE: 'employee:manage',
  EMPLOYEE_READ: 'employee:read',
  PAYROLL_MANAGE: 'payroll:manage',
  PAYROLL_READ: 'payroll:read',
  LEAVE_MANAGE: 'leave:manage',
  LEAVE_READ: 'leave:read',
  ATTENDANCE_MANAGE: 'attendance:manage',
  ATTENDANCE_READ: 'attendance:read',
  BENEFITS_MANAGE: 'benefits:manage',
  BENEFITS_READ: 'benefits:read',
  PERFORMANCE_MANAGE: 'performance:manage',
  PERFORMANCE_READ: 'performance:read',
  RECRUITMENT_MANAGE: 'recruitment:manage',
  RECRUITMENT_READ: 'recruitment:read',
  // Read-only — reports are computed on demand, never created/edited, so
  // there is no REPORTING_MANAGE counterpart.
  REPORTING_READ: 'reporting:read',
  NOTIFICATIONS_MANAGE: 'notifications:manage',
  NOTIFICATIONS_READ: 'notifications:read',
  // Platform-admin only: editing GRA/SSNIT statutory reference data is ops
  // work, not a tenant-level payroll permission (see RLS_CONVENTION.md and
  // project memory — a tenant does not get to set its own tax law).
  PLATFORM_PAYROLL_CONFIG_MANAGE: 'platform:payroll-config:manage',
  // Platform-admin only: a tenant cannot self-certify its own legal-entity
  // verification, so this is deliberately not paired with a tenant-level
  // permission the way ORGANIZATION_MANAGE is.
  PLATFORM_ORGANIZATION_VERIFY: 'platform:organization:verify',
  // Tenant-scoped (not platform-scoped): the account owner customizing
  // their own branding, unlike PLATFORM_TENANT_MANAGE's ops-only lifecycle
  // actions (status changes, etc).
  TENANT_BRANDING_MANAGE: 'tenant:branding:manage',
  // Platform-admin only: subscriptions/invoices are assigned and managed by
  // the platform admin in v1 (no tenant self-serve checkout - see project
  // scoping decision), so there is no tenant-level counterpart yet.
  PLATFORM_BILLING_MANAGE: 'platform:billing:manage',
  // Platform-admin only: the audit trail spans every tenant, so reading it
  // back is an ops/security capability, not something a tenant gets to
  // self-serve on its own rows - deliberately not paired with a
  // tenant-level counterpart, same reasoning as PLATFORM_ORGANIZATION_VERIFY.
  PLATFORM_AUDIT_READ: 'platform:audit:read',
  // Platform-admin only: visibility into stuck/failed Paystack transfers
  // spans every tenant's payslips at once, and it's the platform admin -
  // not the tenant - who owns and operates the Paystack integration those
  // transfers run through. No tenant-level counterpart, same reasoning as
  // PLATFORM_AUDIT_READ/PLATFORM_ORGANIZATION_VERIFY.
  PLATFORM_DISBURSEMENT_READ: 'platform:disbursement:read',
  // Platform-admin only: whether outbound email is actually being
  // delivered spans every tenant's notifications at once, and it's the
  // platform admin - not the tenant - who owns the SendGrid integration
  // those emails go through. No tenant-level counterpart, same reasoning
  // as PLATFORM_AUDIT_READ/PLATFORM_DISBURSEMENT_READ.
  PLATFORM_NOTIFICATION_READ: 'platform:notification:read',
  // An organization's own external billing tool (customers it invoices),
  // not an internal HR function - deliberately granted to ORG_ADMIN despite
  // that role otherwise being scoped to employees only (see ORG_ADMIN's own
  // permission list below), since invoicing is the org's own business
  // operation, not tenant-wide HR administration.
  INVOICING_MANAGE: 'invoicing:manage',
  INVOICING_READ: 'invoicing:read',
  // Platform-admin only: the "How it works" tutorial catalog is the same
  // curated content shown to every tenant, so only the platform admin
  // curates it - no tenant-level counterpart, same reasoning as
  // PLATFORM_PAYROLL_CONFIG_MANAGE. Read side needs no permission at all
  // (every authenticated user can view - see HowItWorksVideoController).
  HOW_IT_WORKS_MANAGE: 'platform:how-it-works:manage',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.PLATFORM_ADMIN]: [
    Permission.PLATFORM_TENANT_MANAGE,
    Permission.ORGANIZATION_MANAGE,
    Permission.ORGANIZATION_READ,
    Permission.USER_MANAGE,
    Permission.USER_READ,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_MANAGE,
    Permission.PAYROLL_READ,
    Permission.PLATFORM_PAYROLL_CONFIG_MANAGE,
    Permission.PLATFORM_ORGANIZATION_VERIFY,
    Permission.LEAVE_MANAGE,
    Permission.LEAVE_READ,
    Permission.ATTENDANCE_MANAGE,
    Permission.ATTENDANCE_READ,
    Permission.BENEFITS_MANAGE,
    Permission.BENEFITS_READ,
    Permission.PERFORMANCE_MANAGE,
    Permission.PERFORMANCE_READ,
    Permission.RECRUITMENT_MANAGE,
    Permission.RECRUITMENT_READ,
    Permission.REPORTING_READ,
    Permission.NOTIFICATIONS_MANAGE,
    Permission.NOTIFICATIONS_READ,
    Permission.INVOICING_MANAGE,
    Permission.INVOICING_READ,
    Permission.PLATFORM_BILLING_MANAGE,
    Permission.PLATFORM_AUDIT_READ,
    Permission.PLATFORM_DISBURSEMENT_READ,
    Permission.PLATFORM_NOTIFICATION_READ,
    Permission.HOW_IT_WORKS_MANAGE,
  ],
  [SystemRole.TENANT_ADMIN]: [
    Permission.TENANT_BRANDING_MANAGE,
    Permission.ORGANIZATION_MANAGE,
    Permission.ORGANIZATION_READ,
    Permission.USER_MANAGE,
    Permission.USER_READ,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_MANAGE,
    Permission.PAYROLL_READ,
    Permission.LEAVE_MANAGE,
    Permission.LEAVE_READ,
    Permission.ATTENDANCE_MANAGE,
    Permission.ATTENDANCE_READ,
    Permission.BENEFITS_MANAGE,
    Permission.BENEFITS_READ,
    Permission.PERFORMANCE_MANAGE,
    Permission.PERFORMANCE_READ,
    Permission.RECRUITMENT_MANAGE,
    Permission.RECRUITMENT_READ,
    Permission.REPORTING_READ,
    Permission.NOTIFICATIONS_MANAGE,
    Permission.NOTIFICATIONS_READ,
    Permission.INVOICING_MANAGE,
    Permission.INVOICING_READ,
  ],
  [SystemRole.HR_MANAGER]: [
    Permission.ORGANIZATION_READ,
    Permission.USER_READ,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_READ,
    Permission.LEAVE_MANAGE,
    Permission.LEAVE_READ,
    Permission.ATTENDANCE_MANAGE,
    Permission.ATTENDANCE_READ,
    Permission.BENEFITS_MANAGE,
    Permission.BENEFITS_READ,
    Permission.PERFORMANCE_MANAGE,
    Permission.PERFORMANCE_READ,
    Permission.RECRUITMENT_MANAGE,
    Permission.RECRUITMENT_READ,
    Permission.REPORTING_READ,
    Permission.NOTIFICATIONS_MANAGE,
    Permission.NOTIFICATIONS_READ,
    Permission.INVOICING_MANAGE,
    Permission.INVOICING_READ,
  ],
  [SystemRole.PAYROLL_MANAGER]: [
    Permission.ORGANIZATION_READ,
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_MANAGE,
    Permission.PAYROLL_READ,
    Permission.REPORTING_READ,
  ],
  // Deliberately narrow (v1 scope cut): employee management only, within
  // whichever single Organization User.organizationId points at
  // (assertOrganizationScope enforces the "within" part - this list alone
  // doesn't). No leave/attendance/payroll/recruitment - those stay
  // TENANT_ADMIN/HR_MANAGER-only for now. USER_READ (not MANAGE) mirrors
  // HR_MANAGER's own grant - both need to list tenant users to link one to
  // an Employee.userId (granting portal access), but neither can invite,
  // deactivate, or change the role of a User themselves. INVOICING is the
  // one exception to "employee management only": it's the organization's
  // own external billing tool, not an internal HR function, so it's
  // in scope even though leave/attendance/payroll aren't.
  [SystemRole.ORG_ADMIN]: [
    Permission.ORGANIZATION_READ,
    Permission.USER_READ,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_READ,
    Permission.INVOICING_MANAGE,
    Permission.INVOICING_READ,
  ],
  [SystemRole.EMPLOYEE]: [],
};

export function hasPermission(role: SystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
