import { ApiProperty } from '@nestjs/swagger';

export class WeeklyReportQuestionsResponseDto {
  @ApiProperty({ type: [String] })
  questions!: string[];
}
