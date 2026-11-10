import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectRequisitionDto {
  @ApiProperty({ example: 'Over budget for this quarter' })
  @IsString()
  @Length(1, 500)
  reviewNote!: string;
}
