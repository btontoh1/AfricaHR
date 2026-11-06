import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ImpersonateUserDto {
  @ApiProperty({
    description:
      'Why this session is needed - stored with the audit entry and included in the notice sent to the impersonated user, so it must be a real, specific reason, not a placeholder.',
    example: 'Investigating payroll error #412 reported by the tenant',
  })
  @IsString()
  @Length(10, 500)
  reason!: string;
}
