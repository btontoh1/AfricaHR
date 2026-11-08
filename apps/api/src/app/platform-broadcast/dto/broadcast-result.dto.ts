import { ApiProperty } from '@nestjs/swagger';

export class BroadcastResultDto {
  @ApiProperty({ description: 'How many tenants had an active TENANT_ADMIN to notify' })
  recipientCount!: number;

  @ApiProperty({ description: 'How many individual email/in-app deliveries failed - a failure here never aborts the rest of the broadcast' })
  failureCount!: number;
}
