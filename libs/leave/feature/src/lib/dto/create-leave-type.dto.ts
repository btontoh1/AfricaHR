import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Length, Matches, Min } from 'class-validator';

export class CreateLeaveTypeDto {
  @ApiProperty({ example: 'Annual Leave' })
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({ example: 'ANNUAL' })
  @Matches(/^[A-Z0-9_]{1,30}$/, {
    message: 'code must be uppercase letters, digits, or underscores',
  })
  code!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiProperty({ example: 15, description: 'Default annual entitlement, in working days' })
  @IsNumber()
  @Min(0)
  defaultEntitlementDays!: number;
}
