import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID } from 'class-validator';

export class SetPeriodCloseDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ description: 'Manual journal entries dated on or before this date can no longer be posted or voided' })
  @IsDateString()
  closedThrough!: string;
}
