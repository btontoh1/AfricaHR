import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class SetupDto {
  @ApiProperty({ example: 'Acme Ghana Ltd' })
  @IsString()
  @Length(2, 200)
  companyName!: string;

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

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  adminFirstName!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  adminLastName!: string;

  @ApiProperty({ example: 'admin@acme-ghana.com' })
  @IsEmail()
  adminEmail!: string;

  @ApiProperty({ description: 'Must satisfy password strength requirements' })
  @IsString()
  adminPassword!: string;
}
