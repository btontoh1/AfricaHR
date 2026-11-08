import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsLatitude, IsLongitude, IsString, Length, Min } from 'class-validator';

export class CreateAttendanceLocationDto {
  @ApiProperty({ example: 'East Legon Office', description: 'Human-readable label for the location' })
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiProperty({ description: 'Location center latitude' })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ description: 'Location center longitude' })
  @IsLongitude()
  longitude!: number;

  @ApiProperty({
    example: 150,
    description: 'Radius in meters around the center within which a clock-in/out is not flagged',
  })
  @IsInt()
  @Min(1)
  radiusMeters!: number;
}
