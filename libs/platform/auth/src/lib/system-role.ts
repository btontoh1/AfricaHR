// Plain string-union (not a TS `enum`), same reasoning as
// @africahr/tenancy-domain's TenantStatus: stays structurally interchangeable
// with Prisma's generated SystemRole type without casts at the boundary.
export const SystemRole = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  PAYROLL_MANAGER: 'PAYROLL_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

// Fixed, code-defined catalog. Tenants pick from the roles above; they
// cannot invent new permissions or roles (see project memory for why this
// was chosen over dynamic per-tenant RBAC — a deliberate v1 scope cut).
export const Permission = {
  PLATFORM_TENANT_MANAGE: 'platform:tenant:manage',
  ORGANIZATION_MANAGE: 'organization:manage',
  USER_MANAGE: 'user:manage',
  USER_READ: 'user:read',
  EMPLOYEE_MANAGE: 'employee:manage',
  EMPLOYEE_READ: 'employee:read',
  PAYROLL_MANAGE: 'payroll:manage',
  PAYROLL_READ: 'payroll:read',
  // Platform-admin only: editing GRA/SSNIT statutory reference data is ops
  // work, not a tenant-level payroll permission (see RLS_CONVENTION.md and
  // project memory — a tenant does not get to set its own tax law).
  PLATFORM_PAYROLL_CONFIG_MANAGE: 'platform:payroll-config:manage',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.PLATFORM_ADMIN]: [
    Permission.PLATFORM_TENANT_MANAGE,
    Permission.ORGANIZATION_MANAGE,
    Permission.USER_MANAGE,
    Permission.USER_READ,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_MANAGE,
    Permission.PAYROLL_READ,
    Permission.PLATFORM_PAYROLL_CONFIG_MANAGE,
  ],
  [SystemRole.TENANT_ADMIN]: [
    Permission.ORGANIZATION_MANAGE,
    Permission.USER_MANAGE,
    Permission.USER_READ,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_MANAGE,
    Permission.PAYROLL_READ,
  ],
  [SystemRole.HR_MANAGER]: [
    Permission.USER_READ,
    Permission.EMPLOYEE_MANAGE,
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_READ,
  ],
  [SystemRole.PAYROLL_MANAGER]: [
    Permission.EMPLOYEE_READ,
    Permission.PAYROLL_MANAGE,
    Permission.PAYROLL_READ,
  ],
  [SystemRole.EMPLOYEE]: [],
};

export function hasPermission(role: SystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
