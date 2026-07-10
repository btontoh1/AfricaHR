import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class LinkHiredEmployeeDto {
  @ApiProperty({ description: 'The Employee record HR created for this hire via the Employee module' })
  @IsUUID()
  employeeId!: string;
}
