import { ApiProperty } from '@nestjs/swagger';

export class DocumentViewUrlResponseDto {
  @ApiProperty({ description: 'Short-lived signed URL to view/download the document directly from storage' })
  viewUrl!: string;
}
