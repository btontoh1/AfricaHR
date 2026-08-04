import { ApiProperty } from '@nestjs/swagger';

export class LeaveBalanceResponseDto {
  @ApiProperty()
  leaveTypeId!: string;

  @ApiProperty()
  leaveTypeName!: string;

  @ApiProperty()
  entitledDays!: number;

  @ApiProperty()
  usedDays!: number;

  @ApiProperty()
  remainingDays!: number;

  @ApiProperty()
  year!: number;
}
