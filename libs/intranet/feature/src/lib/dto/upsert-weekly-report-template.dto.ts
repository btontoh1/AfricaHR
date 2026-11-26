import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsString, Length } from 'class-validator';

export class UpsertWeeklyReportTemplateDto {
  @ApiProperty({
    type: [String],
    example: ['What did you do this week?', 'What problems did you face?', 'What is your plan for next week?'],
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @Length(1, 500, { each: true })
  questions!: string[];
}
