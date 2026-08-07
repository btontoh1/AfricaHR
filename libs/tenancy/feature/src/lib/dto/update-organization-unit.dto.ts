import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateOrganizationUnitDto {
  @ApiPropertyOptional({ example: 'Human Resources' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional({ example: 'HR' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  code?: string;
}
