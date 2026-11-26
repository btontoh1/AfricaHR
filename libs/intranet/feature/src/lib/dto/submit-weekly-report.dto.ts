import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsDateString, IsString, Length } from 'class-validator';

export class SubmitWeeklyReportDto {
  @ApiProperty({ example: '2026-11-23', description: 'Any date within the week being reported - normalized to that week\'s Monday server-side.' })
  @IsDateString()
  weekStart!: string;

  @ApiProperty({
    type: [String],
    description: 'Positional - answers[i] answers the department\'s template question[i].',
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(0, 5000, { each: true })
  answers!: string[];
}
