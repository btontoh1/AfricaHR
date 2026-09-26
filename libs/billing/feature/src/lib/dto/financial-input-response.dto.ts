import { ApiProperty } from '@nestjs/swagger';

/** Shared shape for the acquisition-cost and cash-balance manual-entry endpoints. */
export class FinancialInputResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() month!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() amount!: number;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
}
