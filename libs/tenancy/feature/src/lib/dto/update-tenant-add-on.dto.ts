import { ApiProperty } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import { IsBoolean, IsEnum } from 'class-validator';

export class UpdateTenantAddOnDto {
  @ApiProperty({ enum: Object.values(AddOnModule) })
  @IsEnum(AddOnModule)
  module!: AddOnModule;

  @ApiProperty()
  @IsBoolean()
  enabled!: boolean;
}
