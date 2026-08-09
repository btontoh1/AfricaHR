import { ApiProperty } from '@nestjs/swagger';

/** Confirmation shown to the candidate — no internal application/candidate fields, just proof of submission. */
export class PublicApplicationResponseDto {
  @ApiProperty() applicationId!: string;
}
