import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

/**
 * Narrower than CreateUserDto: role is always PLATFORM_ADMIN and there is
 * no tenantId/organizationId to collect, so this screen doesn't expose that
 * wider surface to the person filling it in. See UserService.createPlatformAdmin.
 */
export class CreatePlatformAdminDto {
  @ApiProperty({ example: 'engineer@parothr.com' })
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
}
