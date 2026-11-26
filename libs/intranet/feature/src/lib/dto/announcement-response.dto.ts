import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AudienceScope } from '@prisma/client';

export class AnnouncementResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() body!: string;
  @ApiPropertyOptional({ nullable: true }) attachmentFileName?: string | null;
  @ApiProperty({ enum: Object.values(AudienceScope) }) audienceScope!: AudienceScope;
  @ApiPropertyOptional({ nullable: true }) organizationId?: string | null;
  @ApiPropertyOptional({ nullable: true }) organizationUnitId?: string | null;
  @ApiProperty() pinned!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  /** Present only when the caller requested it from a self-service route - whether THEY have read this post. */
  @ApiPropertyOptional() isRead?: boolean;
}
