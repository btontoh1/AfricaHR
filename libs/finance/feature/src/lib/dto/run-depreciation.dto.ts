import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsUUID, Length } from 'class-validator';

export class RunDepreciationDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ description: 'Every ACTIVE asset in this organization/currency whose schedule is due by this date is depreciated for one period' })
  @IsDateString()
  asOfDate!: string;
}
