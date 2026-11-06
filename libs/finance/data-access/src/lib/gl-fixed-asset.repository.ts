import { Injectable } from '@nestjs/common';
import { FixedAssetStatus, GlFixedAsset, Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateFixedAssetInput {
  organizationId: string;
  description: string;
  currency: string;
  cost: Prisma.Decimal | number;
  salvageValue: Prisma.Decimal | number;
  usefulLifeMonths: number;
  acquisitionDate: Date;
  nextDepreciationDate: Date;
  createdBy?: string;
}

export interface DepreciationUpdate {
  accumulatedDepreciation: Prisma.Decimal | number;
  lastDepreciationDate: Date;
  nextDepreciationDate: Date | null;
  status: FixedAssetStatus;
}

@Injectable()
export class GlFixedAssetRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateFixedAssetInput): Promise<GlFixedAsset> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glFixedAsset.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          description: input.description,
          currency: input.currency,
          cost: input.cost,
          salvageValue: input.salvageValue,
          usefulLifeMonths: input.usefulLifeMonths,
          acquisitionDate: input.acquisitionDate,
          nextDepreciationDate: input.nextDepreciationDate,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<GlFixedAsset | null> {
    return this.prisma.withTenantContext(tenantId, (tx) => tx.glFixedAsset.findFirst({ where: { id, tenantId } }));
  }

  list(tenantId: string, organizationId?: string): Promise<GlFixedAsset[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glFixedAsset.findMany({
        where: { tenantId, organizationId },
        orderBy: { acquisitionDate: 'desc' },
      }),
    );
  }

  /** Every ACTIVE asset in this organization/currency whose
   * nextDepreciationDate has arrived by asOfDate - runDepreciation's
   * candidate set for one run. ACTIVE alone already excludes
   * FULLY_DEPRECIATED/DISPOSED assets (see GlFixedAsset's own doc comment on
   * nextDepreciationDate being cleared for both). */
  listDueForDepreciation(
    tenantId: string,
    organizationId: string,
    currency: string,
    asOfDate: Date,
  ): Promise<GlFixedAsset[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.glFixedAsset.findMany({
        where: {
          tenantId,
          organizationId,
          currency,
          status: 'ACTIVE',
          nextDepreciationDate: { lte: asOfDate },
        },
        orderBy: { acquisitionDate: 'asc' },
      }),
    );
  }

  /** Called once per asset included in a depreciation run - advances the
   * schedule and flips status to FULLY_DEPRECIATED (clearing
   * nextDepreciationDate) once nothing depreciable remains, same posture as
   * GlRecurringJournalEntryRepository.markRun. */
  updateAfterDepreciation(tenantId: string, id: string, update: DepreciationUpdate, updatedBy?: string): Promise<void> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      await tx.glFixedAsset.update({
        where: { id },
        data: {
          accumulatedDepreciation: update.accumulatedDepreciation,
          lastDepreciationDate: update.lastDepreciationDate,
          nextDepreciationDate: update.nextDepreciationDate,
          status: update.status,
          updatedBy,
        },
      });
    });
  }

  /** v1 never posts a disposal gain/loss entry, and there is no delete -
   * an asset's acquisition entry posts (and permanently stays posted, same
   * as every other non-MANUAL source type - see FinanceService.voidEntry)
   * the moment the row is created, so disposing is the only way to retire
   * one; this just stops it from ever being picked up by
   * listDueForDepreciation again. See compute-fixed-asset-depreciation.ts. */
  dispose(tenantId: string, id: string, disposedAt: Date, updatedBy?: string): Promise<void> {
    return this.prisma.withTenantContext(tenantId, async (tx) => {
      await tx.glFixedAsset.update({
        where: { id },
        data: { status: 'DISPOSED', disposedAt, nextDepreciationDate: null, updatedBy },
      });
    });
  }
}
