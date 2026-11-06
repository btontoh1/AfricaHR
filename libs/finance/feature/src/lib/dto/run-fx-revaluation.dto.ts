import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString, IsUUID, Length, Min } from 'class-validator';

export class RunFxRevaluationDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'USD', description: "The foreign currency being revalued - must differ from the organization's home currency" })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Every monetary account balance in this currency is revalued as of this date' })
  @IsDateString()
  asOfDate!: string;

  @ApiProperty({ description: 'Units of the home currency per 1 unit of currency, as of asOfDate' })
  @IsNumber()
  @Min(0.000001)
  rate!: number;
}
