import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, Min } from 'class-validator';

export class SendOfferDto {
  @ApiProperty({ example: 3500 })
  @IsNumber()
  @Min(0)
  offeredSalary!: number;

  @ApiProperty()
  @IsDateString()
  offeredStartDate!: string;
}
