import { ApiProperty } from '@nestjs/swagger';

/**
 * Deliberately minimal: this is returned to unauthenticated callers
 * resolving a tenant's org-scoped login page, so it never includes id,
 * status, or anything else internal.
 */
export class TenantPublicResponseDto {
  @ApiProperty({ example: 'Acme Ghana Ltd' })
  name!: string;

  @ApiProperty({ example: 'acme-ghana-ltd' })
  slug!: string;
}
