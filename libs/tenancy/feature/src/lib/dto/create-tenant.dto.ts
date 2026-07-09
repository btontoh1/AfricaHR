import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Ghana Ltd' })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiPropertyOptional({
    example: 'acme-ghana',
    description: 'URL-safe identifier. Generated from name if omitted.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase alphanumeric with single hyphens',
  })
  slug?: string;

  @ApiProperty({ example: 'GH', description: 'ISO 3166-1 alpha-2 country code' })
  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'country must be a 2-letter ISO 3166-1 alpha-2 code' })
  country!: string;

  @ApiProperty({ example: 'GHS', description: 'ISO 4217 currency code' })
  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO 4217 code' })
  currency!: string;

  @ApiProperty({ example: 'Africa/Accra', description: 'IANA timezone identifier' })
  @IsString()
  @Length(1, 64)
  timezone!: string;
}
