import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HowItWorksVideoResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiProperty()
  videoUrl!: string;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
