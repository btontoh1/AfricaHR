import { ApiPropertyOptional } from '@nestjs/swagger';

// Same nullable-viewUrl posture as OrganizationLogoUrlResponseDto - no
// secondary logo set is a normal, common state, not an error.
export class OrganizationSecondaryLogoUrlResponseDto {
  @ApiPropertyOptional({ nullable: true, description: 'Short-lived signed URL, or null if no secondary logo is set' })
  viewUrl?: string | null;
}
