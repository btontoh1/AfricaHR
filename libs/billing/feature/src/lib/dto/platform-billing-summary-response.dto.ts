import { ApiProperty } from '@nestjs/swagger';

export class RevenueByCurrencyResponseDto {
  @ApiProperty() currency!: string;
  @ApiProperty() amount!: number;
}

export class ExpiringSubscriptionResponseDto {
  @ApiProperty() tenantId!: string;
  @ApiProperty() tenantName!: string;
  @ApiProperty() currentPeriodEnd!: Date;
  @ApiProperty() currency!: string;
  @ApiProperty({ description: "What the tenant's next invoice would total at its current headcount" })
  amountDue!: number;
}

export class PlatformBillingSummaryResponseDto {
  @ApiProperty({ type: RevenueByCurrencyResponseDto, isArray: true })
  mrr!: RevenueByCurrencyResponseDto[];
  @ApiProperty({
    type: RevenueByCurrencyResponseDto,
    isArray: true,
    description: 'All-time paid invoice total, grouped by currency',
  })
  platformRevenue!: RevenueByCurrencyResponseDto[];
  @ApiProperty({ type: ExpiringSubscriptionResponseDto, isArray: true })
  expiringSubscriptions!: ExpiringSubscriptionResponseDto[];
}
