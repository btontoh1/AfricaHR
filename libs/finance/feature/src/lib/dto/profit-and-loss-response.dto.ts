import { ApiProperty } from '@nestjs/swagger';

export class ProfitAndLossByCurrencyDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty({
    description:
      'Only reflects revenue/expense actually posted so far - payroll disbursement and customer ' +
      'invoicing today, plus whatever manual journal entries have been recorded. Not a complete P&L ' +
      'until other expense sources (rent, subscriptions, etc) are also entered.',
  })
  totalRevenue!: number;

  @ApiProperty()
  totalExpense!: number;

  @ApiProperty()
  netIncome!: number;
}

export class ProfitAndLossResponseDto {
  @ApiProperty({ required: false })
  organizationId?: string;

  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty({
    type: ProfitAndLossByCurrencyDto,
    isArray: true,
    description:
      'One entry per currency the tenant has posted activity in - never blended together, since ' +
      'summing different currencies into one number would be meaningless.',
  })
  byCurrency!: ProfitAndLossByCurrencyDto[];
}
