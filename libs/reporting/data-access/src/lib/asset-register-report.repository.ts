import { Injectable } from '@nestjs/common';
import { CompanyAssetStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface AssetRegisterParams {
  status?: CompanyAssetStatus;
  category?: string;
}

export interface AssetRegisterRow {
  id: string;
  assetTag: string;
  name: string;
  category: string | null;
  status: CompanyAssetStatus;
  purchasePrice: number | null;
  assignedEmployeeId: string | null;
  assignedEmployeeName: string | null;
}

/**
 * Reads company_assets directly, plus "employees" for the currently
 * assigned employee's display name - scope:reporting cannot depend on
 * @africahr/inventory-data-access or @africahr/employee-data-access (Nx
 * module boundary), same cross-bounded-context read pattern as
 * HeadcountReportRepository reading "employees" for headcount. Matches
 * CompanyAssetRepository.list's own deletedAt:null convention.
 */
@Injectable()
export class AssetRegisterReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAssets(tenantId: string, params: AssetRegisterParams = {}): Promise<AssetRegisterRow[]> {
    const assets = await this.prisma.withTenantContext(tenantId, (tx) =>
      tx.companyAsset.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: params.status,
          category: params.category,
        },
        orderBy: { name: 'asc' },
      }),
    );

    const employeeIds = [...new Set(assets.map((asset) => asset.assignedEmployeeId).filter((id): id is string => !!id))];
    const employees =
      employeeIds.length > 0
        ? await this.prisma.withTenantContext(tenantId, (tx) =>
            tx.employee.findMany({
              where: { tenantId, id: { in: employeeIds } },
              select: { id: true, firstName: true, lastName: true },
            }),
          )
        : [];
    const employeeNameById = new Map(employees.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`]));

    return assets.map((asset) => ({
      id: asset.id,
      assetTag: asset.assetTag,
      name: asset.name,
      category: asset.category,
      status: asset.status,
      purchasePrice: asset.purchasePrice?.toNumber() ?? null,
      assignedEmployeeId: asset.assignedEmployeeId,
      assignedEmployeeName: asset.assignedEmployeeId ? employeeNameById.get(asset.assignedEmployeeId) ?? null : null,
    }));
  }
}
