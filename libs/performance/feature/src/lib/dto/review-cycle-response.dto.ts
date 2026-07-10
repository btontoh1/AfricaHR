import { ApiProperty } from '@nestjs/swagger';
import { PerformanceReviewCycleStatus } from '@prisma/client';

export class ReviewCycleResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() startDate!: string;
  @ApiProperty() endDate!: string;
  @ApiProperty({ enum: Object.values(PerformanceReviewCycleStatus) }) status!: PerformanceReviewCycleStatus;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
