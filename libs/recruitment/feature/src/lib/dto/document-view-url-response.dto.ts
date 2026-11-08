import { ApiProperty } from '@nestjs/swagger';

/**
 * Shared by the resume-view-url and identity-document-view-url routes —
 * identical shape, no reason to duplicate. Distinct from tenancy-feature's
 * own DocumentViewUrlResponseDto of the same name (scope:recruitment
 * cannot import across that module boundary — see eslint.config.mjs).
 */
export class DocumentViewUrlResponseDto {
  @ApiProperty()
  viewUrl!: string;
}
