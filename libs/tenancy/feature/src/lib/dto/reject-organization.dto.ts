import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RejectOrganizationDto {
  @ApiProperty({ example: 'Registration number does not match the uploaded certificate' })
  @IsString()
  @Length(1, 1000)
  note!: string;
}
