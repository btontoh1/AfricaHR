import { ApiProperty } from '@nestjs/swagger';

export class OperatingCostResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() month!: string;
  @ApiProperty() currency!: string;
  @ApiProperty() amount!: number;
  @ApiProperty({ nullable: true, type: String }) notes!: string | null;
}
