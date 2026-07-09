import { ApiProperty } from '@nestjs/swagger';
import { SystemRole } from '@africahr/platform-auth';
import { IsEnum } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: Object.values(SystemRole) })
  @IsEnum(SystemRole)
  role!: SystemRole;
}
