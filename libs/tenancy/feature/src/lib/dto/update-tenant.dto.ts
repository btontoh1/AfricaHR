import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Acme Ghana Ltd' })
  @IsOptional()
  @IsString()
  @Length(2, 200)
  name?: string;

  @ApiPropertyOptional({
    example: 'acme-ghana',
    description: 'URL-safe identifier used in tenant-scoped sign-in links.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with single hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'GH', description: 'ISO 3166-1 alpha-2 country code' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO 3166-1 alpha-2 code' })
  country?: string;

  @ApiPropertyOptional({ example: 'GHS', description: 'ISO 4217 currency code' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
  currency?: string;

  @ApiPropertyOptional({ example: 'Africa/Accra', description: 'IANA timezone identifier' })
  @IsOptional()
  @IsString()
  @Length(1, 64)
  timezone?: string;
}
