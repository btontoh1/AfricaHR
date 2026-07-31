import { ApiProperty } from '@nestjs/swagger';
import { LeaveRequestResponseDto } from './leave-request-response.dto';

export class TeamLeaveRequestResponseDto extends LeaveRequestResponseDto {
  @ApiProperty() employeeName!: string;
}
