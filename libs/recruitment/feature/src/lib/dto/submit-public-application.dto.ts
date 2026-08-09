import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityDocumentType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';

/**
 * What an anonymous candidate submits from a company's public careers
 * page. Mirrors CreateCandidateDto, minus `source` — the public path sets
 * that itself. The four *StorageKey/*FileName fields are only ever
 * populated from a prior requestResumeUpload/requestIdentityDocumentUpload
 * response - this DTO doesn't accept file bytes (see StorageService's doc
 * comment: every transfer goes browser -> storage directly).
 */
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 500)
  resumeStorageKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  resumeFileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 500)
  identityDocumentStorageKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  identityDocumentFileName?: string;

  @ApiPropertyOptional({ enum: Object.values(IdentityDocumentType) })
  @IsOptional()
  @IsEnum(IdentityDocumentType)
  identityDocumentType?: IdentityDocumentType;
}
