import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayslipLineItemType } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreatePayslipLineItemDto {
  @ApiProperty({ enum: Object.values(PayslipLineItemType) })
  @IsEnum(PayslipLineItemType)
  type!: PayslipLineItemType;

  @ApiProperty({ example: 'OVERTIME' })
  @IsString()
  @Length(1, 50)
  code!: string;

  @ApiPropertyOptional({ example: 'October overtime, 12 hours' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  @Min(0)
  amount!: number;
}
