import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceScope } from '@prisma/client';

export class PolicyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() folder!: string;
  @ApiProperty() fileName!: string;
  @ApiProperty() version!: number;
  @ApiPropertyOptional({ nullable: true }) supersedesId?: string | null;
  @ApiProperty({ enum: Object.values(AudienceScope) }) audienceScope!: AudienceScope;
  @ApiPropertyOptional({ nullable: true }) organizationId?: string | null;
  @ApiPropertyOptional({ nullable: true }) organizationUnitId?: string | null;
  @ApiProperty() publishedAt!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  /** Present only when the caller requested it from a self-service route - whether THEY have acknowledged this policy. */
  @ApiPropertyOptional() acknowledgedByMe?: boolean;
}
