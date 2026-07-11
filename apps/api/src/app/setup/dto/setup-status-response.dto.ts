import { ApiProperty } from '@nestjs/swagger';

export class SetupStatusResponseDto {
  @ApiProperty({ description: 'True when no tenant exists yet — the first-run wizard should run' })
  needsSetup!: boolean;
}
