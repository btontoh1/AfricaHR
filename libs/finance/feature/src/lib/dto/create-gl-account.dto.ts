import { ApiProperty } from '@nestjs/swagger';
import { GlAccountType } from '@prisma/client';
import { IsEnum, IsString, Length } from 'class-validator';

export class CreateGlAccountDto {
  @ApiProperty({ example: '5100', description: 'Unique per tenant - not tied to any numbering convention' })
  @IsString()
  @Length(1, 20)
  code!: string;

  @ApiProperty({ example: 'Rent Expense' })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty({ enum: GlAccountType })
  @IsEnum(GlAccountType)
  type!: GlAccountType;
}
