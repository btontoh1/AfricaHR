import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType, JobRequisitionStatus } from '@prisma/client';

export class JobRequisitionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() organizationId!: string;
  @ApiPropertyOptional({ nullable: true }) organizationUnitId?: string | null;
  @ApiPropertyOptional({ nullable: true }) hiringManagerId?: string | null;
  @ApiProperty() title!: string;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
  @ApiProperty({ enum: Object.values(EmploymentType) }) employmentType!: EmploymentType;
  @ApiProperty() openings!: number;
  @ApiProperty({ enum: Object.values(JobRequisitionStatus) }) status!: JobRequisitionStatus;
  @ApiPropertyOptional({ nullable: true }) targetHireDate?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
