import { Injectable } from '@nestjs/common';
import { RequestUser } from '@africahr/platform-auth';
import { PlatformFinancialInputRepository } from '@africahr/billing-data-access';
import { PlatformFinancialInputType } from '@prisma/client';
import { SetFinancialInputDto } from './dto/set-financial-input.dto';
import { FinancialInputResponseDto } from './dto/financial-input-response.dto';

/**
 * CRUD for the two hand-entered inputs behind the Investor/Board tier's
 * LTV:CAC and burn/runway figures - see PlatformFinancialInput's schema
 * comment for why acquisition cost and cash balance can't come from
 * anywhere else. Both share PlatformFinancialInputRepository, distinguished
 * only by PlatformFinancialInputType.
 */
@Injectable()
export class PlatformInvestorMetricsService {
  constructor(private readonly financialInputs: PlatformFinancialInputRepository) {}

  async setAcquisitionCost(dto: SetFinancialInputDto, actor: RequestUser): Promise<FinancialInputResponseDto> {
    return this.financialInputs.set({
      type: PlatformFinancialInputType.ACQUISITION_COST,
      month: dto.month,
      currency: dto.currency,
      amount: dto.amount,
      notes: dto.notes,
      actorId: actor.sub,
    });
  }

  async listAcquisitionCosts(): Promise<FinancialInputResponseDto[]> {
    return this.financialInputs.list(PlatformFinancialInputType.ACQUISITION_COST);
  }

  async setCashBalance(dto: SetFinancialInputDto, actor: RequestUser): Promise<FinancialInputResponseDto> {
    return this.financialInputs.set({
      type: PlatformFinancialInputType.CASH_BALANCE,
      month: dto.month,
      currency: dto.currency,
      amount: dto.amount,
      notes: dto.notes,
      actorId: actor.sub,
    });
  }

  async listCashBalances(): Promise<FinancialInputResponseDto[]> {
    return this.financialInputs.list(PlatformFinancialInputType.CASH_BALANCE);
  }
}
