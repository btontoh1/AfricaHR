import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString, Length, Min } from 'class-validator';

export class UpdateAttendanceLocationDto {
  @ApiPropertyOptional({ example: 'East Legon Office' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsInt()
  @Min(1)
  radiusMeters?: number;
}
