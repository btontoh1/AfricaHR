import { ApiProperty } from '@nestjs/swagger';

export class MfaConfirmResponseDto {
  @ApiProperty({
    type: [String],
    description: 'One-time recovery codes, shown only once - store them somewhere safe',
  })
  backupCodes!: string[];
}
