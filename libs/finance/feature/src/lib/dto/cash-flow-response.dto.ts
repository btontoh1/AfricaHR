import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CashFlowResponseDto {
  @ApiPropertyOptional()
  organizationId?: string;

  @ApiProperty()
  from!: string;

  @ApiProperty()
  to!: string;

  @ApiProperty({
    description:
      'Net change in Cash and Bank over the period, classified entirely as Operating - there is no ' +
      'AP/investing/financing activity yet to split out into the other standard cash-flow sections.',
  })
  netCashChange!: number;
}
