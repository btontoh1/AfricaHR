import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FamilyMemberRelationship } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class FamilyMemberDto {
  @ApiProperty({ enum: Object.values(FamilyMemberRelationship) })
  @IsEnum(FamilyMemberRelationship)
  relationship!: FamilyMemberRelationship;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
