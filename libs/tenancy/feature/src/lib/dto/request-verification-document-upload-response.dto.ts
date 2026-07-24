import { ApiProperty } from '@nestjs/swagger';

export class RequestVerificationDocumentUploadResponseDto {
  @ApiProperty({ description: 'Short-lived signed URL — PUT the file bytes here directly, not through this API' })
  uploadUrl!: string;

  @ApiProperty()
  documentId!: string;
}
