import { Injectable } from '@nestjs/common';
import { RequestUser } from '@africahr/platform-auth';
import { PlatformOperatingCostRepository } from '@africahr/billing-data-access';
import { SetOperatingCostDto } from './dto/set-operating-cost.dto';
import { OperatingCostResponseDto } from './dto/operating-cost-response.dto';

@Injectable()
export class PlatformOperatingCostService {
  constructor(private readonly operatingCosts: PlatformOperatingCostRepository) {}

  async setCost(dto: SetOperatingCostDto, actor: RequestUser): Promise<OperatingCostResponseDto> {
    const cost = await this.operatingCosts.set({
      month: dto.month,
      currency: dto.currency,
      amount: dto.amount,
      notes: dto.notes,
      actorId: actor.sub,
    });
    return cost;
  }

  async listCosts(): Promise<OperatingCostResponseDto[]> {
    return this.operatingCosts.list();
  }
}
