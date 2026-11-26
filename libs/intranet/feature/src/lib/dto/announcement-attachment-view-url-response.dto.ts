import { ApiProperty } from '@nestjs/swagger';

export class AnnouncementAttachmentViewUrlResponseDto {
  @ApiProperty()
  viewUrl!: string;
}
