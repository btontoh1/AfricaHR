import { ApiProperty } from '@nestjs/swagger';

export class BalanceSheetByCurrencyDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty()
  totalAssets!: number;

  @ApiProperty()
  totalLiabilities!: number;

  @ApiProperty({
    description:
      'Retained earnings since inception (cumulative revenue minus cumulative expense as of the ' +
      'balance sheet date) - there is no dedicated Equity account in the default chart of accounts.',
  })
  totalEquity!: number;
}

export class BalanceSheetResponseDto {
  @ApiProperty({ required: false })
  organizationId?: string;

  @ApiProperty({ description: 'The balance sheet date - a snapshot as of this point in time, not a period' })
  asOf!: string;

  @ApiProperty({
    type: BalanceSheetByCurrencyDto,
    isArray: true,
    description: 'One entry per currency the tenant has posted activity in - never blended together.',
  })
  byCurrency!: BalanceSheetByCurrencyDto[];
}
