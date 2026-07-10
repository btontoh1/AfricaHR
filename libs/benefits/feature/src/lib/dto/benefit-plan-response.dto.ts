import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BenefitContributionType } from '@prisma/client';

export class BenefitPlanResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() code!: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty({ enum: Object.values(BenefitContributionType) }) contributionType!: BenefitContributionType;
  @ApiProperty() employeeContribution!: string;
  @ApiProperty() employerContribution!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
