import { ApiProperty } from '@nestjs/swagger';

export class CreatePolicyResponseDto {
  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty()
  policyId!: string;
}
