import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class NotificationDeliveryCountsDto {
  @ApiProperty() sent!: number;
  @ApiProperty() failed!: number;
  @ApiProperty() pending!: number;
}

export class FailedNotificationDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiPropertyOptional({ nullable: true }) tenantName!: string | null;
  @ApiProperty() userId!: string;
  @ApiProperty() userEmail!: string;
  @ApiProperty() userFirstName!: string;
  @ApiProperty() userLastName!: string;
  @ApiProperty() subject!: string;
  @ApiPropertyOptional({ nullable: true }) failureReason!: string | null;
  @ApiProperty() createdAt!: Date;
}

export class NotificationDeliveryResponseDto {
  @ApiProperty({ type: NotificationDeliveryCountsDto })
  counts!: NotificationDeliveryCountsDto;

  @ApiProperty({ type: [FailedNotificationDto] })
  failed!: FailedNotificationDto[];
}
