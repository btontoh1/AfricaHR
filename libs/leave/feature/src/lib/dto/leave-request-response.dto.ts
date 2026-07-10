import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeaveRequestStatus } from '@prisma/client';

export class LeaveRequestResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  leaveTypeId!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  daysRequested!: string;

  @ApiPropertyOptional()
  reason?: string | null;

  @ApiProperty({ enum: Object.values(LeaveRequestStatus) })
  status!: LeaveRequestStatus;

  @ApiPropertyOptional()
  approverUserId?: string | null;

  @ApiPropertyOptional()
  approvedAt?: string | null;

  @ApiPropertyOptional()
  rejectionReason?: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
