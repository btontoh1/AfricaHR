import { ApiProperty } from '@nestjs/swagger';

export class PolicyAcknowledgementResponseDto {
  @ApiProperty()
  employeeId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  readAt!: string;
}
