import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

/** HR/manager-facing: start a review for an arbitrary employee (self-service uses StartReviewDto, no employeeId). */
export class StartReviewForEmployeeDto {
  @ApiProperty()
  @IsUUID()
  employeeId!: string;

  @ApiProperty()
  @IsUUID()
  cycleId!: string;
}
