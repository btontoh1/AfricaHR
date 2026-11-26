import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class AddWeeklyReportCommentDto {
  @ApiProperty({ example: 'Great progress this week - keep it up.' })
  @IsString()
  @Length(1, 2000)
  body!: string;
}
