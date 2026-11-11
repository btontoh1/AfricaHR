import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface AttendanceEligibleEmployee {
  id: string;
  userId: string | null;
}

export interface KioskEmployee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
}

export interface EmployeeClockInPin {
  id: string;
  firstName: string;
  lastName: string;
  clockInPinHash: string | null;
}

/**
 * Reads only the Employee fields attendance needs. scope:attendance cannot
 * import employee-data-access's repository/service classes (Nx module
 * boundary), so this queries the shared "employees" table directly through
 * PrismaService — same pattern as payroll's PayrollEmployeeRepository and
 * leave's LeaveEmployeeRepository. findByUserId is what makes self-service
 * clock-in/out possible.
 */
@Injectable()
export class AttendanceEmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByUserId(tenantId: string, userId: string): Promise<AttendanceEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { tenantId, userId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<AttendanceEligibleEmployee | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, userId: true },
      }),
    );
  }

  /**
   * Tenant-wide, not scoped to a specific kiosk device/site — every active
   * employee is listed regardless of which physical kiosk they tap in on.
   * Fine for now since a tenant typically has one or a handful of kiosks;
   * a future v2 could add a per-site Employee→kiosk assignment if a tenant
   * needs the list filtered per device.
   */
  listActiveForKiosk(tenantId: string): Promise<KioskEmployee[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findMany({
        where: { tenantId, deletedAt: null, employmentStatus: 'ACTIVE' },
        select: { id: true, employeeNumber: true, firstName: true, lastName: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
    );
  }

  findByIdWithPin(tenantId: string, id: string): Promise<EmployeeClockInPin | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.findFirst({
        where: { id, tenantId, deletedAt: null },
        select: { id: true, firstName: true, lastName: true, clockInPinHash: true },
      }),
    );
  }

  async setClockInPinHash(tenantId: string, id: string, clockInPinHash: string): Promise<void> {
    await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employee.update({
        where: { id },
        data: { clockInPinHash },
      }),
    );
  }
}
