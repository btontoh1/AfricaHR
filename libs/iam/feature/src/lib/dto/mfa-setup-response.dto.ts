import { ApiProperty } from '@nestjs/swagger';

export class MfaSetupResponseDto {
  @ApiProperty({ description: 'Base32 secret, for manual entry if the QR code can\'t be scanned' })
  secret!: string;

  @ApiProperty({ description: 'otpauth:// URI - render as a QR code for the authenticator app to scan' })
  otpauthUri!: string;
}
