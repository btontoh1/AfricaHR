import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class SendFromTemplateDto {
  @ApiProperty({ description: 'The User (not Employee) who will receive this notification' })
  @IsUUID()
  userId!: string;

  @ApiProperty()
  @IsUUID()
  templateId!: string;

  @ApiPropertyOptional({ example: { firstName: 'Ama', startDate: '2026-06-08' } })
  @IsOptional()
  @IsObject()
  variables?: Record<string, string>;
}
