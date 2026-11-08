import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class UpsertAttendancePolicyDto {
  @ApiProperty({ example: 8, description: 'Standard working hours per day, beyond which time counts as overtime' })
  @IsNumber()
  @Min(0)
  standardDailyHours!: number;
}
