import { Injectable } from '@nestjs/common';
import { StatutoryRate, StatutoryTaxBand } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StatutoryRateRepository, StatutoryTaxBandRepository } from '@africahr/payroll-data-access';
import { CreateStatutoryTaxBandDto } from './dto/create-statutory-tax-band.dto';
import { CreateStatutoryRateDto } from './dto/create-statutory-rate.dto';

/**
 * Platform-admin-only management of GRA/SSNIT reference data (see project
 * memory: tax law is never hardcoded, and a tenant does not get to set its
 * own). All actions are audited with tenantId: null, same as tenant
 * onboarding — this is ops work, not tenant-scoped activity.
 */
@Injectable()
export class StatutoryDataService {
  constructor(
    private readonly taxBands: StatutoryTaxBandRepository,
    private readonly rates: StatutoryRateRepository,
    private readonly audit: AuditService,
  ) {}

  async createTaxBand(dto: CreateStatutoryTaxBandDto, actorId?: string): Promise<StatutoryTaxBand> {
    const band = await this.taxBands.create({
      countryCode: dto.countryCode,
      order: dto.order,
      lowerBound: dto.lowerBound,
      upperBound: dto.upperBound,
      rate: dto.rate,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId: null,
      actorUserId: actorId ?? null,
      action: 'payroll.statutory_tax_band.created',
      resourceType: 'StatutoryTaxBand',
      resourceId: band.id,
      metadata: { countryCode: dto.countryCode, order: dto.order },
    });

    return band;
  }

  listTaxBands(countryCode: string): Promise<StatutoryTaxBand[]> {
    return this.taxBands.listByCountry(countryCode);
  }

  async createRate(dto: CreateStatutoryRateDto, actorId?: string): Promise<StatutoryRate> {
    const rate = await this.rates.create({
      countryCode: dto.countryCode,
      code: dto.code,
      rate: dto.rate,
      effectiveFrom: new Date(dto.effectiveFrom),
      effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId: null,
      actorUserId: actorId ?? null,
      action: 'payroll.statutory_rate.created',
      resourceType: 'StatutoryRate',
      resourceId: rate.id,
      metadata: { countryCode: dto.countryCode, code: dto.code },
    });

    return rate;
  }

  listRates(countryCode: string): Promise<StatutoryRate[]> {
    return this.rates.listByCountry(countryCode);
  }
}
