import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@africahr/platform-auth';

// Curated to what the UI needs, not a 1:1 Prisma mirror — passwordHash is
// deliberately excluded (same "curated, not mirrored" principle as
// EmployeeResponseDto in Module 2).
export class UserResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional({ nullable: true }) tenantId?: string | null;
  @ApiProperty() email!: string;
  @ApiProperty() firstName!: string;
  @ApiProperty() lastName!: string;
  @ApiProperty({ enum: Object.values(SystemRole) }) role!: SystemRole;
  @ApiProperty() isActive!: boolean;
  @ApiPropertyOptional({ nullable: true }) lastLoginAt?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
