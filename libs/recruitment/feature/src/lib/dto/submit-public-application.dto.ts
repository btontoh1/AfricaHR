import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

/** What an anonymous candidate submits from a company's public careers page. Mirrors CreateCandidateDto, minus `source` — the public path sets that itself. */
export class SubmitPublicApplicationDto {
  @ApiProperty()
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  lastName!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 30)
  phone?: string;
}
