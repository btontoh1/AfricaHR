import { ApiProperty } from '@nestjs/swagger';

export class BenefitContributionResponseDto {
  @ApiProperty() employee!: number;
  @ApiProperty() employer!: number;
}
