import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel } from '@prisma/client';

export class NotificationTemplateResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() code!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: Object.values(NotificationChannel) }) channel!: NotificationChannel;
  @ApiProperty() subjectTemplate!: string;
  @ApiProperty() bodyTemplate!: string;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
