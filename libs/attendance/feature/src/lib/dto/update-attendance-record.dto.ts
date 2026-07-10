import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class UpdateAttendanceRecordDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  clockIn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  clockOut?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  notes?: string;
}
