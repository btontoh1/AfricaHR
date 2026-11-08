import { ApiProperty } from '@nestjs/swagger';

export class TrialBalanceAccountRowDto {
  @ApiProperty()
  accountCode!: string;

  @ApiProperty()
  accountName!: string;

  @ApiProperty()
  debit!: number;

  @ApiProperty()
  credit!: number;
}

export class TrialBalanceByCurrencyDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty({ type: TrialBalanceAccountRowDto, isArray: true, description: 'Only accounts with any activity - not every account in the chart of accounts' })
  accounts!: TrialBalanceAccountRowDto[];

  @ApiProperty({ description: 'Always equal to totalCredit - proves the ledger balances as of this date' })
  totalDebit!: number;

  @ApiProperty()
  totalCredit!: number;
}

export class TrialBalanceResponseDto {
  @ApiProperty({ required: false })
  organizationId?: string;

  @ApiProperty({ description: 'A snapshot as of this point in time, not a period' })
  asOf!: string;

  @ApiProperty({
    type: TrialBalanceByCurrencyDto,
    isArray: true,
    description: 'One entry per currency the tenant has posted activity in - never blended together.',
  })
  byCurrency!: TrialBalanceByCurrencyDto[];
}
