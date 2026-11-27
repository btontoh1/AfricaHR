import { ApiProperty } from '@nestjs/swagger';

/**
 * Deliberately minimal: this is returned to unauthenticated callers
 * resolving an organization's own sign-in link, so it never includes id,
 * tenantId, verification status, or anything else internal.
 */
export class OrganizationPublicResponseDto {
  @ApiProperty({ example: 'Baffour & Egyir Ringlife Ltd' })
  name!: string;

  @ApiProperty({ example: 'baffour-egyir-ringlife-ltd' })
  slug!: string;
}
