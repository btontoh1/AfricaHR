import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfitAndLossResponseDto {
  @ApiPropertyOptional()
  organizationId?: string;

  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

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
