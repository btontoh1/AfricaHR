import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: 'Acme Ghana Ltd' })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  legalName?: string;

  @ApiPropertyOptional({ example: 'Acme' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  tradingName?: string;

  @ApiPropertyOptional({ example: 'GH', description: 'ISO 3166-1 alpha-2 country code' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'countryCode must be a 2-letter ISO 3166-1 alpha-2 code' })
  countryCode?: string;

  @ApiPropertyOptional({ example: 'BN-12345' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'C0012345678' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  taxIdentificationNumber?: string;

  @ApiPropertyOptional({
    example: { ssnitEmployerNumber: 'SS123456' },
    description: 'Country-specific registration fields without a dedicated column',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
