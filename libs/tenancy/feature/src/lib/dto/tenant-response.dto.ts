import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';

export class TenantResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ['TRIAL', 'ACTIVE', 'SUSPENDED', 'CLOSED'] })
  status!: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

  @ApiProperty()
  country!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  timezone!: string;

  @ApiPropertyOptional({ nullable: true })
  logoStorageKey?: string | null;

  @ApiProperty({ enum: Object.values(AddOnModule), isArray: true })
  enabledAddOns!: AddOnModule[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ nullable: true })
  deletedAt?: string | null;

  @ApiPropertyOptional({ nullable: true })
  createdBy?: string | null;

  @ApiPropertyOptional({ nullable: true })
  updatedBy?: string | null;
}
