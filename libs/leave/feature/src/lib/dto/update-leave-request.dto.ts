import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

// HR/Tenant Admin correction of an existing request's dates - deliberately
// no leaveTypeId or employeeId here, this is a dates/day-count fix, not a
// way to re-target a request at a different employee or leave type.
export class UpdateLeaveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  reason?: string;
}
