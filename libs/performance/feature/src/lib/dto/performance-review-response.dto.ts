import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PerformanceReviewStatus } from '@prisma/client';

export class PerformanceReviewResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() employeeId!: string;
  @ApiProperty() cycleId!: string;
  @ApiProperty({ enum: Object.values(PerformanceReviewStatus) }) status!: PerformanceReviewStatus;
  @ApiPropertyOptional({ nullable: true }) selfRating?: number | null;
  @ApiPropertyOptional({ nullable: true }) selfComments?: string | null;
  @ApiPropertyOptional({ nullable: true }) selfSubmittedAt?: string | null;
  @ApiPropertyOptional({ nullable: true }) managerRating?: number | null;
  @ApiPropertyOptional({ nullable: true }) managerComments?: string | null;
  @ApiPropertyOptional({ nullable: true }) managerUserId?: string | null;
  @ApiPropertyOptional({ nullable: true }) managerReviewedAt?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
