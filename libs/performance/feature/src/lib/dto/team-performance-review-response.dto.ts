import { ApiProperty } from '@nestjs/swagger';
import { PerformanceReviewResponseDto } from './performance-review-response.dto';

export class TeamPerformanceReviewResponseDto extends PerformanceReviewResponseDto {
  @ApiProperty() employeeName!: string;
}
