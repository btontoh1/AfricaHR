import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogEntryDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true, description: 'null for platform-admin-initiated actions' })
  tenantId!: string | null;
  @ApiPropertyOptional({ nullable: true }) tenantName!: string | null;
  @ApiPropertyOptional({ nullable: true, description: 'null for system-initiated actions' })
  actorUserId!: string | null;
  @ApiPropertyOptional({ nullable: true }) actorEmail!: string | null;
  @ApiPropertyOptional({ nullable: true }) actorFirstName!: string | null;
  @ApiPropertyOptional({ nullable: true }) actorLastName!: string | null;
  @ApiProperty({ description: 'e.g. "tenant.created", "user.role_changed"' }) action!: string;
  @ApiProperty() resourceType!: string;
  @ApiPropertyOptional({ nullable: true }) resourceId!: string | null;
  @ApiPropertyOptional({ nullable: true, type: 'object', additionalProperties: true }) metadata!: unknown;
  @ApiProperty() createdAt!: Date;
}

export class AuditLogPageResponseDto {
  @ApiProperty({ type: [AuditLogEntryDto] }) items!: AuditLogEntryDto[];
  @ApiProperty({ description: 'Total rows matching the current filters, across all pages' })
  totalCount!: number;
}
