import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel, NotificationStatus } from '@prisma/client';

export class NotificationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() userId!: string;
  @ApiProperty({ enum: Object.values(NotificationChannel) }) channel!: NotificationChannel;
  @ApiProperty() subject!: string;
  @ApiProperty() body!: string;
  @ApiProperty({ enum: Object.values(NotificationStatus) }) status!: NotificationStatus;
  @ApiProperty() isRead!: boolean;
  @ApiPropertyOptional({ nullable: true }) readAt?: string | null;
  @ApiPropertyOptional({ nullable: true }) sentAt?: string | null;
  @ApiPropertyOptional({ nullable: true }) failureReason?: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Relative in-app route to navigate to when this notification is clicked, e.g. "/leave/requests/team". Null when there is no sensible destination.',
  })
  linkPath?: string | null;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
