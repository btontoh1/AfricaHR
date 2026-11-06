import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUrl, Length, Min } from 'class-validator';

export class CreateHowItWorksVideoDto {
  @ApiProperty()
  @IsString()
  @Length(1, 200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;

  @ApiProperty({ example: 'https://www.youtube.com/watch?v=...' })
  @IsUrl()
  videoUrl!: string;

  @ApiPropertyOptional({ example: 'Getting Started' })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  category?: string;

  @ApiPropertyOptional({ description: 'Lower numbers appear first', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
