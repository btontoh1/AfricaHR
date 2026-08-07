import { Injectable } from '@nestjs/common';
import { EmployeeFamilyMember, FamilyMemberRelationship } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface FamilyMemberInput {
  relationship: FamilyMemberRelationship;
  name: string;
  dateOfBirth?: Date;
}

@Injectable()
export class FamilyMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  listByEmployee(tenantId: string, employeeId: string): Promise<EmployeeFamilyMember[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.employeeFamilyMember.findMany({
        where: { tenantId, employeeId },
        orderBy: [{ relationship: 'asc' }, { createdAt: 'asc' }],
      }),
    );
  }

  /**
   * Replaces the full set of dependents for an employee. This data has no
   * history/audit requirement (unlike EmploymentHistoryEntry), so the form
   * just resubmits the current full list on every save rather than diffing
   * individual adds/edits/removes.
   */
  replaceForEmployee(
    tenantId: string,
    employeeId: string,
    members: FamilyMemberInput[],
  ): Promise<EmployeeFamilyMember[]> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      await tx.employeeFamilyMember.deleteMany({ where: { tenantId, employeeId } });
      if (members.length > 0) {
        await tx.employeeFamilyMember.createMany({
          data: members.map((member) => ({
            tenantId,
            employeeId,
            relationship: member.relationship,
            name: member.name,
            dateOfBirth: member.dateOfBirth,
          })),
        });
      }
      return tx.employeeFamilyMember.findMany({
        where: { tenantId, employeeId },
        orderBy: [{ relationship: 'asc' }, { createdAt: 'asc' }],
      });
    });
  }
}
