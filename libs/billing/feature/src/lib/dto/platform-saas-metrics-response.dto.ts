import { ApiProperty } from '@nestjs/swagger';

export class MrrHistoryPointResponseDto {
  @ApiProperty({ description: 'YYYY-MM' }) month!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() mrr!: number;
  @ApiProperty({ description: 'Distinct tenants billed that month' }) tenantCount!: number;
}

export class ArrByCurrencyResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty({ description: "Latest month's MRR x 12" }) arr!: number;
}

export class MrrWaterfallResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty({ description: 'The month this waterfall ends on' }) month!: string;
  @ApiProperty() previousMonth!: string;
  @ApiProperty() startingMrr!: number;
  @ApiProperty() newMrr!: number;
  @ApiProperty() expansionMrr!: number;
  @ApiProperty() contractionMrr!: number;
  @ApiProperty() churnedMrr!: number;
  @ApiProperty() endingMrr!: number;
  @ApiProperty() netNewMrr!: number;
  @ApiProperty() startingTenantCount!: number;
  @ApiProperty() newTenantCount!: number;
  @ApiProperty() churnedTenantCount!: number;
}

export class ChurnRatesResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty() month!: string;
  @ApiProperty() logoChurnRatePercent!: number;
  @ApiProperty() revenueChurnRatePercent!: number;
}

export class SubscriptionFunnelEntryResponseDto {
  @ApiProperty() status!: string;
  @ApiProperty() count!: number;
}

export class AverageRevenuePerTenantResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty() amount!: number;
}

export class CohortRetentionRowResponseDto {
  @ApiProperty({ description: 'YYYY-MM signup month' }) cohortMonth!: string;
  @ApiProperty() cohortSize!: number;
  @ApiProperty({
    type: [Number],
    description: 'Retention percent by months elapsed since the cohort month - index 0 (the cohort month itself) is always 100',
  })
  retentionByMonthsElapsed!: number[];
}

export class PlatformSaasMetricsResponseDto {
  @ApiProperty({ type: MrrHistoryPointResponseDto, isArray: true }) mrrHistory!: MrrHistoryPointResponseDto[];
  @ApiProperty({ type: ArrByCurrencyResponseDto, isArray: true }) arr!: ArrByCurrencyResponseDto[];
  @ApiProperty({
    type: MrrWaterfallResponseDto,
    isArray: true,
    description: 'Most recent complete month-over-month comparison, per currency - empty until at least 2 months of billing history exist',
  })
  waterfall!: MrrWaterfallResponseDto[];
  @ApiProperty({ type: ChurnRatesResponseDto, isArray: true }) churnRates!: ChurnRatesResponseDto[];
  @ApiProperty({ type: SubscriptionFunnelEntryResponseDto, isArray: true }) subscriptionFunnel!: SubscriptionFunnelEntryResponseDto[];
  @ApiProperty({ type: AverageRevenuePerTenantResponseDto, isArray: true })
  averageRevenuePerTenant!: AverageRevenuePerTenantResponseDto[];
  @ApiProperty({ type: CohortRetentionRowResponseDto, isArray: true }) cohortRetention!: CohortRetentionRowResponseDto[];
}
