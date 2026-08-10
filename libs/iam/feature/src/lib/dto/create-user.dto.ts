import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemRole } from '@africahr/platform-auth';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateUserDto {
  @ApiPropertyOptional({
    description:
      'Required when the actor is a platform admin (which tenant to create the user in). Ignored for tenant-admin actors, who can only create users in their own tenant.',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ example: 'hr@acme.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Must satisfy password strength requirements' })
  @IsString()
  password!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 100)
  lastName!: string;

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
