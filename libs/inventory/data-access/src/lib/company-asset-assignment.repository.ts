import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CompanyAsset, CompanyAssetAssignment } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

@Injectable()
export class CompanyAssetAssignmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Opens a new assignment and marks the asset ASSIGNED, atomically - only
   * when the asset is currently AVAILABLE, so a double-assign (two
   * concurrent requests, or a client that missed a status refresh) is
   * rejected rather than silently overwriting whoever holds it now.
   */
  async assign(
    tenantId: string,
    assetId: string,
    input: { employeeId: string; assignNote?: string; assignedByUserId?: string },
  ): Promise<CompanyAssetAssignment> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const result = await tx.companyAsset.updateMany({
        where: { id: assetId, tenantId, status: 'AVAILABLE', deletedAt: null },
        data: { status: 'ASSIGNED', assignedEmployeeId: input.employeeId },
      });
      if (result.count === 0) {
        const existing = await tx.companyAsset.findFirst({ where: { id: assetId, tenantId, deletedAt: null } });
        if (!existing) {
          throw new NotFoundException(`Asset "${assetId}" not found`);
        }
        throw new ConflictException(`Asset "${existing.assetTag}" is not available (status: ${existing.status})`);
      }

      return tx.companyAssetAssignment.create({
        data: {
          tenantId,
          assetId,
          employeeId: input.employeeId,
          assignNote: input.assignNote,
          assignedByUserId: input.assignedByUserId,
        },
      });
    });
  }

  /**
   * Closes the asset's open assignment and marks it AVAILABLE again,
   * atomically. Rejects when there is no open assignment to close, rather
   * than silently no-op'ing.
   */
  async returnAsset(
    tenantId: string,
    assetId: string,
    input: { returnNote?: string } = {},
  ): Promise<CompanyAssetAssignment> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      const open = await tx.companyAssetAssignment.findFirst({
        where: { tenantId, assetId, returnedAt: null },
        orderBy: { assignedAt: 'desc' },
      });
      if (!open) {
        throw new ConflictException('This asset has no open assignment to return');
      }

      const assignment = await tx.companyAssetAssignment.update({
        where: { id: open.id },
        data: { returnedAt: new Date(), returnNote: input.returnNote },
      });

      await tx.companyAsset.update({
        where: { id: assetId },
        data: { status: 'AVAILABLE', assignedEmployeeId: null },
      });

      return assignment;
    });
  }

  listForAsset(tenantId: string, assetId: string): Promise<CompanyAssetAssignment[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAssetAssignment.findMany({
        where: { tenantId, assetId },
        orderBy: { assignedAt: 'desc' },
      }),
    );
  }

  listForEmployee(tenantId: string, employeeId: string): Promise<(CompanyAssetAssignment & { asset: CompanyAsset })[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAssetAssignment.findMany({
        where: { tenantId, employeeId },
        include: { asset: true },
        orderBy: { assignedAt: 'desc' },
      }),
    );
  }
}
