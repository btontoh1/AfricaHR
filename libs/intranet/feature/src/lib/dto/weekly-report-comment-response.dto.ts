import { ApiProperty } from '@nestjs/swagger';

export class WeeklyReportCommentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() authorName!: string;
  @ApiProperty() body!: string;
  @ApiProperty() createdAt!: string;
}
