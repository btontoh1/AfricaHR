import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus } from '@africahr/tenancy-domain';
import { IsEnum } from 'class-validator';

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: TenantStatus })
  @IsEnum(TenantStatus)
  status!: TenantStatus;
}
