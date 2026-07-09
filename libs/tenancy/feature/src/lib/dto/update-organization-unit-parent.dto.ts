import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateOrganizationUnitParentDto {
  @ApiPropertyOptional({ description: 'New parent unit id. Omit/null to make it a root unit.' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
