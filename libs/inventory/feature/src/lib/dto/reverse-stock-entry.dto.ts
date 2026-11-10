import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ReverseStockEntryDto {
  @ApiProperty({ description: 'Why this posted entry is being corrected' })
  @IsString()
  @Length(10, 1000)
  reason!: string;
}
