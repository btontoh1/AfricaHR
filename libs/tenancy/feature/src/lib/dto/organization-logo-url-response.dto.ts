import { ApiPropertyOptional } from '@nestjs/swagger';

// Unlike DocumentViewUrlResponseDto, viewUrl here is nullable - a newly
// created organization has no logo yet, and that's a normal, common state
// this endpoint needs to represent, not an error.
export class OrganizationLogoUrlResponseDto {
  @ApiPropertyOptional({ nullable: true, description: 'Short-lived signed URL, or null if no logo is set' })
  viewUrl?: string | null;
}
