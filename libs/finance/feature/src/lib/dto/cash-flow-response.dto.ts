import { ApiProperty } from '@nestjs/swagger';

export class CashFlowByCurrencyDto {
  @ApiProperty()
  currency!: string;

  @ApiProperty({
    description:
      'Net change in Cash and Bank over the period, classified entirely as Operating - there is no ' +
      'AP/investing/financing activity yet to split out into the other standard cash-flow sections.',
  })
  netCashChange!: number;
}

export class CashFlowResponseDto {
  @ApiProperty({ required: false })
  organizationId?: string;

  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty({
    type: CashFlowByCurrencyDto,
    isArray: true,
    description: 'One entry per currency the tenant has posted cash activity in - never blended together.',
  })
  byCurrency!: CashFlowByCurrencyDto[];
}
