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

export class RuleOf40ResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty({ description: 'The month this compares against the previous one' }) month!: string;
  @ApiProperty() previousMonth!: string;
  @ApiProperty({ description: 'Revenue for `month`, from MRR history' }) revenue!: number;
  @ApiProperty({ description: 'Operating cost entered for `month` - 0 if none was entered' }) cost!: number;
  @ApiProperty() revenueGrowthRatePercent!: number;
  @ApiProperty() profitMarginPercent!: number;
  @ApiProperty({ description: 'growth rate + profit margin - 40 or above is considered healthy' }) score!: number;
}

export class RevenueRetentionResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty({ description: 'The month this compares against the previous one' }) month!: string;
  @ApiProperty() previousMonth!: string;
  @ApiProperty({ description: 'Can exceed 100% when expansion outpaces churn' }) netRevenueRetentionPercent!: number;
  @ApiProperty({ description: "Never exceeds 100% - doesn't count new business" }) grossRevenueRetentionPercent!: number;
}

export class LtvToCacResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty() month!: string;
  @ApiProperty({ description: 'Average revenue per tenant divided by the monthly logo churn rate' }) ltv!: number;
  @ApiProperty({ description: 'Acquisition cost entered for `month` divided by tenants acquired that month' }) cac!: number;
  @ApiProperty({ description: 'LTV divided by CAC - 3 or higher is the common SaaS benchmark' }) ratio!: number;
  @ApiProperty({
    nullable: true,
    type: Number,
    description: 'Months to recoup CAC from revenue alone (CAC / ARPU) - null when there is no ARPU to recoup it from',
  })
  paybackMonths!: number | null;
}

export class BurnAndRunwayResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty() month!: string;
  @ApiProperty({ description: 'Operating cost minus revenue - positive means burning cash' }) netBurn!: number;
  @ApiProperty({ description: 'Cash balance entered for `month`' }) cashBalance!: number;
  @ApiProperty({ nullable: true, type: Number, description: 'Months of cash left at the current burn rate - null when not burning cash' })
  runwayMonths!: number | null;
  @ApiProperty({ nullable: true, type: Number, description: 'Net burn divided by net-new MRR - null when there was no growth to divide by' })
  burnMultiple!: number | null;
}

export class QuickRatioResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty() month!: string;
  @ApiProperty({
    nullable: true,
    type: Number,
    description:
      '(new + expansion) / (contraction + churn) - above 4 is excellent, 1-4 is sustainable growth, below 1 means shrinking. Null when there was no contraction or churn to divide by.',
  })
  value!: number | null;
}

export class MagicNumberResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty({ description: 'The month this compares against the previous one' }) month!: string;
  @ApiProperty() previousMonth!: string;
  @ApiProperty({
    nullable: true,
    type: Number,
    description:
      "Net-new MRR this month divided by the PRIOR month's acquisition spend - above 0.75 is considered capital-efficient. Null when no acquisition cost was entered for the prior month.",
  })
  value!: number | null;
}

export class TenantRevenueShareResponseDto {
  @ApiProperty() tenantId!: string;
  @ApiProperty() tenantName!: string;
  @ApiProperty() amount!: number;
  @ApiProperty() sharePercent!: number;
}

export class RevenueConcentrationResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty({ description: 'The latest billed month this snapshot is for' }) month!: string;
  @ApiProperty({ type: TenantRevenueShareResponseDto, isArray: true }) topTenants!: TenantRevenueShareResponseDto[];
  @ApiProperty({ description: 'Combined share of the tenants above - a customer-concentration/whale-risk signal' })
  topTenantsSharePercent!: number;
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
  @ApiProperty({
    type: RevenueRetentionResponseDto,
    isArray: true,
    description: 'Net/gross revenue retention - empty until at least 2 months of billing history exist',
  })
  revenueRetention!: RevenueRetentionResponseDto[];
  @ApiProperty({
    type: QuickRatioResponseDto,
    isArray: true,
    description: 'Growth efficiency - empty until at least 2 months of billing history exist',
  })
  quickRatio!: QuickRatioResponseDto[];
  @ApiProperty({
    type: RuleOf40ResponseDto,
    isArray: true,
    description: 'Empty until both 2+ months of billing history and a matching operating cost entry exist',
  })
  ruleOf40!: RuleOf40ResponseDto[];
  @ApiProperty({
    type: LtvToCacResponseDto,
    isArray: true,
    description: 'Empty until both 2+ months of billing history and a matching acquisition cost entry exist',
  })
  ltvToCac!: LtvToCacResponseDto[];
  @ApiProperty({
    type: BurnAndRunwayResponseDto,
    isArray: true,
    description: 'Empty until both an operating cost and a cash balance entry exist for the latest billed month',
  })
  burnAndRunway!: BurnAndRunwayResponseDto[];
  @ApiProperty({
    type: MagicNumberResponseDto,
    isArray: true,
    description: 'Empty until both 2+ months of billing history and an acquisition cost entry for the PRIOR month exist',
  })
  magicNumber!: MagicNumberResponseDto[];
  @ApiProperty({
    type: RevenueConcentrationResponseDto,
    isArray: true,
    description: 'Customer-concentration risk for the latest billed month, per currency',
  })
  revenueConcentration!: RevenueConcentrationResponseDto[];
  @ApiProperty({ type: SubscriptionFunnelEntryResponseDto, isArray: true }) subscriptionFunnel!: SubscriptionFunnelEntryResponseDto[];
  @ApiProperty({ type: AverageRevenuePerTenantResponseDto, isArray: true })
  averageRevenuePerTenant!: AverageRevenuePerTenantResponseDto[];
  @ApiProperty({ type: CohortRetentionRowResponseDto, isArray: true }) cohortRetention!: CohortRetentionRowResponseDto[];
}
