import { ApiProperty } from '@nestjs/swagger';

export class BudgetVsActualRowDto {
  @ApiProperty()
  accountCode!: string;

  @ApiProperty()
  accountName!: string;

  @ApiProperty()
  budgetAmount!: number;

  @ApiProperty()
  actualAmount!: number;

  @ApiProperty({ description: 'actualAmount - budgetAmount - positive means over budget' })
  varianceAmount!: number;

  @ApiProperty({ nullable: true, description: 'Null when budgetAmount is 0' })
  variancePercent!: number | null;
}

export class BudgetVsActualByCurrencyDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty({ type: BudgetVsActualRowDto, isArray: true, description: 'Only accounts that have a budget set for this year - not every account in the chart of accounts' })
  rows!: BudgetVsActualRowDto[];

  @ApiProperty()
  totalBudget!: number;

  @ApiProperty()
  totalActual!: number;

  @ApiProperty()
  totalVariance!: number;
}

export class BudgetVsActualResponseDto {
  @ApiProperty({ required: false })
  organizationId?: string;

  @ApiProperty()
  fiscalYear!: number;

  @ApiProperty({
    type: BudgetVsActualByCurrencyDto,
    isArray: true,
    description: 'One entry per currency that has a budget set for this year - never blended together.',
  })
  byCurrency!: BudgetVsActualByCurrencyDto[];
}
