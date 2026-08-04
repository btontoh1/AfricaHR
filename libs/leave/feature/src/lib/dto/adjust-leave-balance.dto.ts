import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

/** HR-facing: correct or grant an arbitrary employee's leave balance for a given leave type/year. */
export class AdjustLeaveBalanceDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty()
  @IsUUID()
  leaveTypeId!: string;

  @ApiProperty()
  @IsInt()
  year!: number;

  @ApiPropertyOptional({ description: 'Absolute value, not a delta. Omit to leave unchanged.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  entitledDays?: number;

  @ApiPropertyOptional({ description: 'Absolute value, not a delta. Omit to leave unchanged.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  usedDays?: number;
}
