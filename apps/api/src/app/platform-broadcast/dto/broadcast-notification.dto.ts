import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class BroadcastNotificationDto {
  @ApiProperty({ description: 'Short, human-readable subject line', example: 'Updated Terms of Service' })
  @IsString()
  @Length(1, 300)
  subject!: string;

  @ApiProperty({
    description: 'Plain-text body sent by email and shown in-app',
    example:
      "We've updated our Terms of Service to describe how our support team accesses accounts for troubleshooting. See https://parothr.com/terms for details.",
  })
  @IsString()
  @Length(1, 5000)
  body!: string;
}
