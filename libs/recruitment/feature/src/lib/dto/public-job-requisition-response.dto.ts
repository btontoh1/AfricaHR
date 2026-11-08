import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';

/**
 * Deliberately narrow — this is what an anonymous candidate on a company's
 * own careers page sees, so it excludes tenantId, organizationId, openings,
 * and every other internal field JobRequisitionResponseDto carries.
 */
export class PublicJobRequisitionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty({ enum: Object.values(EmploymentType) }) employmentType!: EmploymentType;
}
