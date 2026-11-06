import { ApiProperty } from '@nestjs/swagger';

export class AttendanceLocationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() name!: string;
  @ApiProperty() latitude!: string;
  @ApiProperty() longitude!: string;
  @ApiProperty() radiusMeters!: number;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
