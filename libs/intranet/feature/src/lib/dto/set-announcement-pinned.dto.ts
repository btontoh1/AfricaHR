import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetAnnouncementPinnedDto {
  @ApiProperty()
  @IsBoolean()
  pinned!: boolean;
}
