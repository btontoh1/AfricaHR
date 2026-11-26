import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAnnouncementResponseDto {
  @ApiProperty()
  announcementId!: string;

  @ApiPropertyOptional({ description: 'Present only when the post included an attachment.' })
  uploadUrl?: string;
}
