import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectLeaveRequestDto {
  @ApiProperty({ example: 'Insufficient team coverage for the requested dates' })
  @IsString()
  @Length(1, 500)
  rejectionReason!: string;
}
