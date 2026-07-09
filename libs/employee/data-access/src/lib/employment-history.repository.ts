import { Injectable } from '@nestjs/common';
import { EmploymentHistoryEntry } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateEmploymentHistoryEntryInput {
  employeeId: string;
  changeType: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  effectiveDate: Date;
  createdBy?: string;
}

@Injectable()
export class EmploymentHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    input: CreateEmploymentHistoryEntryInput,
  ): Promise<EmploymentHistoryEntry> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employmentHistoryEntry.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          changeType: input.changeType,
          fieldName: input.fieldName,
          oldValue: input.oldValue,
          newValue: input.newValue,
          effectiveDate: input.effectiveDate,
          createdBy: input.createdBy,
        },
      }),
    );
  }

  listByEmployee(tenantId: string, employeeId: string): Promise<EmploymentHistoryEntry[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employmentHistoryEntry.findMany({
        where: { tenantId, employeeId },
        orderBy: { effectiveDate: 'desc' },
      }),
    );
  }
}
