import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';

export class SubscriptionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() pricePerEmployee!: number;
  @ApiProperty() currency!: string;
  @ApiProperty({ enum: Object.values(SubscriptionStatus) }) status!: SubscriptionStatus;
  @ApiProperty() currentPeriodStart!: Date;
  @ApiProperty() currentPeriodEnd!: Date;
  @ApiProperty() cancelAtPeriodEnd!: boolean;
  @ApiProperty({
    description:
      "ParotHR's own flat margin charged per payroll disbursement transaction, on top of Paystack's real transfer cost - 0 means none is charged",
  })
  disbursementFeeAmount!: number;
  @ApiProperty({
    description:
      'A fixed charge per billing period, independent of headcount - 0 means pure per-employee billing',
  })
  flatFeeAmount!: number;
  @ApiProperty({
    description:
      'How many employees flatFeeAmount already covers before pricePerEmployee starts applying to the remainder',
  })
  includedEmployeeCount!: number;
}

export class SubscriptionSummaryResponseDto {
  @ApiProperty({ type: SubscriptionResponseDto }) subscription!: SubscriptionResponseDto;
  @ApiProperty() activeEmployeeCount!: number;
  @ApiProperty({ description: 'What the next invoice would total at the current headcount' })
  currentAmountDue!: number;
  @ApiProperty() isExpiringSoon!: boolean;
}
