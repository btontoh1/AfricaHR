import { Injectable } from '@nestjs/common';
import { PrismaService } from '@africahr/platform-database';

export interface EmployeeMissingWeeklyReport {
  tenantId: string;
  userId: string;
  employeeId: string;
  firstName: string;
}

@Injectable()
export class WeeklyReportReminderRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cross-tenant, across every tenant at once - the reminder sweep needs
   * one list spanning all tenants, same genuinely-cross-tenant shape as
   * UserRepository.findActiveTenantAdmins(). Goes through the §5 SECURITY
   * DEFINER escape hatch (find_employees_missing_weekly_report) rather
   * than withTenantContext, since no single tenant context covers every
   * tenant's rows.
   */
  findEmployeesMissingReport(weekStart: Date): Promise<EmployeeMissingWeeklyReport[]> {
    return this.prisma.$queryRaw<
      EmployeeMissingWeeklyReport[]
    >`SELECT * FROM find_employees_missing_weekly_report(${weekStart}::date)`;
  }
}
