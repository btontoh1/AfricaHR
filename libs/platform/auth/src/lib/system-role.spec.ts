import { hasPermission, Permission, SystemRole } from './system-role';

describe('hasPermission', () => {
  it('grants platform admins tenant management', () => {
    expect(hasPermission(SystemRole.PLATFORM_ADMIN, Permission.PLATFORM_TENANT_MANAGE)).toBe(
      true,
    );
  });

  it('does not grant tenant admins tenant management', () => {
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.PLATFORM_TENANT_MANAGE)).toBe(
      false,
    );
  });

  it('grants tenant admins organization management', () => {
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.ORGANIZATION_MANAGE)).toBe(true);
  });

  it('grants HR managers read-only user access', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.USER_READ)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.USER_MANAGE)).toBe(false);
  });

  it('grants employees no management permissions', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.USER_READ)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.USER_MANAGE)).toBe(false);
  });

  it('grants HR managers full employee management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.EMPLOYEE_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.EMPLOYEE_READ)).toBe(true);
  });

  it('grants payroll managers read-only employee access', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.EMPLOYEE_READ)).toBe(true);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.EMPLOYEE_MANAGE)).toBe(false);
  });

  it('grants employees no employee-management permissions', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.EMPLOYEE_READ)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.EMPLOYEE_MANAGE)).toBe(false);
  });

  it('grants payroll managers full payroll management', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.PAYROLL_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.PAYROLL_READ)).toBe(true);
  });

  it('grants HR managers read-only payroll access', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.PAYROLL_READ)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.PAYROLL_MANAGE)).toBe(false);
  });

  it('restricts statutory payroll config management to platform admins', () => {
    expect(
      hasPermission(SystemRole.PLATFORM_ADMIN, Permission.PLATFORM_PAYROLL_CONFIG_MANAGE),
    ).toBe(true);
    expect(
      hasPermission(SystemRole.TENANT_ADMIN, Permission.PLATFORM_PAYROLL_CONFIG_MANAGE),
    ).toBe(false);
    expect(
      hasPermission(SystemRole.PAYROLL_MANAGER, Permission.PLATFORM_PAYROLL_CONFIG_MANAGE),
    ).toBe(false);
  });

  it('grants employees no payroll permissions', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PAYROLL_READ)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PAYROLL_MANAGE)).toBe(false);
  });
});
