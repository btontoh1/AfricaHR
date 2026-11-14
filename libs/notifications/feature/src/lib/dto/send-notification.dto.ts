import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ description: 'The User (not Employee) who will receive this notification' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: Object.values(NotificationChannel) })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiProperty()
  @IsString()
  @Length(1, 300)
  subject!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 5000)
  body!: string;

  @ApiPropertyOptional({
    description: 'Relative in-app route the recipient lands on when they click this notification, e.g. "/leave/requests/team"',
    example: '/leave/requests/team',
  })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  linkPath?: string;
}
