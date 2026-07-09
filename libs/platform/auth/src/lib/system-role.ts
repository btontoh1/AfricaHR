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
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ROLE_PERMISSIONS: Record<SystemRole, Permission[]> = {
  [SystemRole.PLATFORM_ADMIN]: [
    Permission.PLATFORM_TENANT_MANAGE,
    Permission.ORGANIZATION_MANAGE,
    Permission.USER_MANAGE,
    Permission.USER_READ,
  ],
  [SystemRole.TENANT_ADMIN]: [
    Permission.ORGANIZATION_MANAGE,
    Permission.USER_MANAGE,
    Permission.USER_READ,
  ],
  [SystemRole.HR_MANAGER]: [Permission.USER_READ],
  [SystemRole.PAYROLL_MANAGER]: [],
  [SystemRole.EMPLOYEE]: [],
};

export function hasPermission(role: SystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
