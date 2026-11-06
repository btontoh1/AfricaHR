import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DemoRequestAdminResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phoneNumber!: string;

  @ApiProperty()
  isWhatsapp!: boolean;

  @ApiProperty()
  organizationName!: string;

  @ApiPropertyOptional()
  numberOfEmployees?: string | null;

  @ApiPropertyOptional()
  preferredDate?: string | null;

  @ApiPropertyOptional()
  preferredTime?: string | null;

  @ApiPropertyOptional()
  viewedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
