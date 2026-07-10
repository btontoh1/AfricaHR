import { ApiProperty } from '@nestjs/swagger';

export class AttendancePolicyResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() standardDailyHours!: string;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
