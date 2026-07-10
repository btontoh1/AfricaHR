import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, Length } from 'class-validator';

export class CreateReviewCycleDto {
  @ApiProperty({ example: 'Q1 2026 Review' })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;
}
