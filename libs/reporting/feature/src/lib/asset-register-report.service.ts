import { Injectable } from '@nestjs/common';
import { CompanyAssetStatus } from '@prisma/client';
import { AssetRegisterReportRepository } from '@africahr/reporting-data-access';
import { AssetRegisterReportDto } from './dto/asset-register-report-response.dto';

export interface AssetRegisterReportParams {
  status?: CompanyAssetStatus;
  category?: string;
}

@Injectable()
export class AssetRegisterReportService {
  constructor(private readonly assets: AssetRegisterReportRepository) {}

  async generate(tenantId: string, params: AssetRegisterReportParams): Promise<AssetRegisterReportDto> {
    const assets = await this.assets.listAssets(tenantId, params);

    const countsByStatus = new Map<CompanyAssetStatus, number>();
    let totalPurchasePrice = 0;
    for (const asset of assets) {
      countsByStatus.set(asset.status, (countsByStatus.get(asset.status) ?? 0) + 1);
      totalPurchasePrice += asset.purchasePrice ?? 0;
    }

    return {
      assets,
      countsByStatus: Array.from(countsByStatus.entries()).map(([status, count]) => ({ status, count })),
      totalPurchasePrice,
    };
  }
}
