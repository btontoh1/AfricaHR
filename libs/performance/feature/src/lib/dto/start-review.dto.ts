import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class StartReviewDto {
  @ApiProperty()
  @IsUUID()
  cycleId!: string;
}
