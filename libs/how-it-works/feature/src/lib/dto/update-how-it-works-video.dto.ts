import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';

export class UpdateHowItWorksVideoDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 100)
  category?: string;

  @ApiPropertyOptional({ description: 'Lower numbers appear first' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
