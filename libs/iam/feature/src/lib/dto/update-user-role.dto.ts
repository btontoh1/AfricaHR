import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@africahr/platform-auth';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Object.values(SystemRole) })
  @IsEnum(SystemRole)
  role!: SystemRole;

  @ApiPropertyOptional({
    description: 'Required when role is ORG_ADMIN (which Organization they administer); rejected otherwise.',
  })
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
