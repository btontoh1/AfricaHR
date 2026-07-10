import { ApiProperty } from '@nestjs/swagger';
import { NotificationChannel } from '@prisma/client';
import { IsEnum, IsString, Length } from 'class-validator';

export class CreateNotificationTemplateDto {
  @ApiProperty({ example: 'LEAVE_APPROVED', description: 'Unique within the tenant' })
  @IsString()
  @Length(1, 100)
  code!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty({ enum: Object.values(NotificationChannel) })
  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @ApiProperty({ example: 'Your leave request was approved' })
  @IsString()
  @Length(1, 300)
  subjectTemplate!: string;

  @ApiProperty({ example: 'Hi {{firstName}}, your leave from {{startDate}} to {{endDate}} was approved.' })
  @IsString()
  @Length(1, 5000)
  bodyTemplate!: string;
}
