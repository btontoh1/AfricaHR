import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DemoRequestAdminResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  email!: string;

  @ApiPropertyOptional()
  phoneNumber?: string | null;

  @ApiProperty()
  organizationName!: string;

  @ApiPropertyOptional()
  numberOfEmployees?: string | null;

  @ApiPropertyOptional()
  preferredDate?: string | null;

  @ApiPropertyOptional()
  preferredTime?: string | null;

  @ApiProperty()
  createdAt!: Date;
}
