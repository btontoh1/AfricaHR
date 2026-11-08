import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator';

/** What an anonymous visitor submits from the "Book a demo" form on the public marketing site. */
export class SubmitDemoRequestDto {
  @ApiProperty()
  @IsString()
  @Length(1, 200)
  fullName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 30)
  phoneNumber!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isWhatsapp?: boolean;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  organizationName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 30)
  numberOfEmployees?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 30)
  preferredDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 30)
  preferredTime?: string;
}
