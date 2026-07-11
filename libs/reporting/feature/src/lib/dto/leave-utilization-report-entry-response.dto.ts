import { ApiProperty } from '@nestjs/swagger';

export class LeaveUtilizationReportEntryResponseDto {
  @ApiProperty() leaveTypeId!: string;
  @ApiProperty() leaveTypeName!: string;
  @ApiProperty() totalEntitledDays!: number;
  @ApiProperty() totalUsedDays!: number;
  @ApiProperty() utilizationPercent!: number;
}
