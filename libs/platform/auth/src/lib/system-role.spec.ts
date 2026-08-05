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

  it('grants HR managers and payroll managers read-only organization access, not management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.ORGANIZATION_READ)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.ORGANIZATION_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.ORGANIZATION_READ)).toBe(true);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.ORGANIZATION_MANAGE)).toBe(false);
  });

  it('grants employees no organization permissions', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.ORGANIZATION_READ)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.ORGANIZATION_MANAGE)).toBe(false);
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

  it('restricts organization verification to platform admins', () => {
    expect(hasPermission(SystemRole.PLATFORM_ADMIN, Permission.PLATFORM_ORGANIZATION_VERIFY)).toBe(
      true,
    );
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.PLATFORM_ORGANIZATION_VERIFY)).toBe(
      false,
    );
  });

  it('grants employees no payroll permissions', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PAYROLL_READ)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PAYROLL_MANAGE)).toBe(false);
  });

  it('grants HR managers and tenant admins full leave management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.LEAVE_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.LEAVE_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.LEAVE_MANAGE)).toBe(true);
  });

  it('grants payroll managers no leave permissions', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.LEAVE_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.LEAVE_READ)).toBe(false);
  });

  it('grants employees no leave-management permissions (self-service is handled separately, not via this permission)', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.LEAVE_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.LEAVE_READ)).toBe(false);
  });

  it('grants HR managers and tenant admins full attendance management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.ATTENDANCE_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.ATTENDANCE_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.ATTENDANCE_MANAGE)).toBe(true);
  });

  it('grants payroll managers no attendance permissions', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.ATTENDANCE_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.ATTENDANCE_READ)).toBe(false);
  });

  it('grants employees no attendance-management permissions (self-service clock-in/out is handled separately)', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.ATTENDANCE_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.ATTENDANCE_READ)).toBe(false);
  });

  it('grants HR managers and tenant admins full benefits management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.BENEFITS_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.BENEFITS_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.BENEFITS_MANAGE)).toBe(true);
  });

  it('grants payroll managers no benefits permissions', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.BENEFITS_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.BENEFITS_READ)).toBe(false);
  });

  it('grants employees no benefits-management permissions (self-service enroll/cancel is handled separately)', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.BENEFITS_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.BENEFITS_READ)).toBe(false);
  });

  it('grants HR managers and tenant admins full performance management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.PERFORMANCE_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.PERFORMANCE_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.PERFORMANCE_MANAGE)).toBe(true);
  });

  it('grants payroll managers no performance permissions', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.PERFORMANCE_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.PERFORMANCE_READ)).toBe(false);
  });

  it('grants employees no performance-management permissions (self and direct-manager access is handled separately)', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PERFORMANCE_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PERFORMANCE_READ)).toBe(false);
  });

  it('grants HR managers and tenant admins full recruitment management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.RECRUITMENT_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.RECRUITMENT_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.RECRUITMENT_MANAGE)).toBe(true);
  });

  it('grants payroll managers no recruitment permissions', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.RECRUITMENT_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.RECRUITMENT_READ)).toBe(false);
  });

  it('grants employees no recruitment-management permissions (hiring-manager access is handled separately)', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.RECRUITMENT_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.RECRUITMENT_READ)).toBe(false);
  });

  it('grants platform admins, tenant admins, HR managers, and payroll managers read access to reports', () => {
    expect(hasPermission(SystemRole.PLATFORM_ADMIN, Permission.REPORTING_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.REPORTING_READ)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.REPORTING_READ)).toBe(true);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.REPORTING_READ)).toBe(true);
  });

  it('grants employees no reporting permissions', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.REPORTING_READ)).toBe(false);
  });

  it('grants HR managers and tenant admins full notifications management', () => {
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.NOTIFICATIONS_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.NOTIFICATIONS_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.NOTIFICATIONS_MANAGE)).toBe(true);
  });

  it('grants payroll managers no notifications permissions', () => {
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.NOTIFICATIONS_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.NOTIFICATIONS_READ)).toBe(false);
  });

  it('grants employees no notifications-management permissions (self-service inbox is handled separately)', () => {
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.NOTIFICATIONS_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.NOTIFICATIONS_READ)).toBe(false);
  });

  it('grants only tenant admins tenant branding management', () => {
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.TENANT_BRANDING_MANAGE)).toBe(true);
    expect(hasPermission(SystemRole.PLATFORM_ADMIN, Permission.TENANT_BRANDING_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.TENANT_BRANDING_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.TENANT_BRANDING_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.TENANT_BRANDING_MANAGE)).toBe(false);
  });

  it('restricts billing management to platform admins', () => {
    expect(hasPermission(SystemRole.PLATFORM_ADMIN, Permission.PLATFORM_BILLING_MANAGE)).toBe(
      true,
    );
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.PLATFORM_BILLING_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.PLATFORM_BILLING_MANAGE)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PLATFORM_BILLING_MANAGE)).toBe(false);
  });

  it('restricts audit log reads to platform admins', () => {
    expect(hasPermission(SystemRole.PLATFORM_ADMIN, Permission.PLATFORM_AUDIT_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.PLATFORM_AUDIT_READ)).toBe(false);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.PLATFORM_AUDIT_READ)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.PLATFORM_AUDIT_READ)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PLATFORM_AUDIT_READ)).toBe(false);
  });

  it('restricts disbursement visibility to platform admins', () => {
    expect(hasPermission(SystemRole.PLATFORM_ADMIN, Permission.PLATFORM_DISBURSEMENT_READ)).toBe(true);
    expect(hasPermission(SystemRole.TENANT_ADMIN, Permission.PLATFORM_DISBURSEMENT_READ)).toBe(false);
    expect(hasPermission(SystemRole.HR_MANAGER, Permission.PLATFORM_DISBURSEMENT_READ)).toBe(false);
    expect(hasPermission(SystemRole.PAYROLL_MANAGER, Permission.PLATFORM_DISBURSEMENT_READ)).toBe(false);
    expect(hasPermission(SystemRole.EMPLOYEE, Permission.PLATFORM_DISBURSEMENT_READ)).toBe(false);
  });
});
