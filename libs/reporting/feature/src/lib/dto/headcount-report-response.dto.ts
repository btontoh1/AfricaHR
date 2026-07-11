import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmploymentType } from '@prisma/client';

export class HeadcountByEmploymentTypeResponseDto {
  @ApiProperty({ enum: Object.values(EmploymentType) }) employmentType!: EmploymentType;
  @ApiProperty() count!: number;
}

export class HeadcountByOrganizationUnitResponseDto {
  @ApiPropertyOptional({ nullable: true }) organizationUnitId?: string | null;
  @ApiProperty() count!: number;
}

export class HeadcountReportResponseDto {
  @ApiProperty() activeCount!: number;
  @ApiProperty({ type: HeadcountByEmploymentTypeResponseDto, isArray: true })
  byEmploymentType!: HeadcountByEmploymentTypeResponseDto[];
  @ApiProperty({ type: HeadcountByOrganizationUnitResponseDto, isArray: true })
  byOrganizationUnit!: HeadcountByOrganizationUnitResponseDto[];
  @ApiPropertyOptional({ description: 'Only present when both from and to are supplied' })
  hiresInPeriod?: number;
  @ApiPropertyOptional({ description: 'Only present when both from and to are supplied' })
  terminationsInPeriod?: number;
}
