import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecurringJournalEntryLineDto {
  @ApiProperty({ description: "A GlAccount id from this tenant's chart of accounts" })
  @IsUUID()
  accountId!: string;

  @ApiPropertyOptional({ description: 'Set exactly one of debit/credit per line, never both.' })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  debit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  credit?: number;
}

export class CreateRecurringJournalEntryDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  description!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 28, description: 'Day of the month this posts on - capped at 28 so every month has that day' })
  @IsInt()
  @Min(1)
  @Max(28)
  dayOfMonth!: number;

  @ApiProperty({ description: 'The first run is the first occurrence of dayOfMonth on or after this date' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({ description: 'Once a scheduled run would fall after this date, the template deactivates itself instead of posting' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ type: RecurringJournalEntryLineDto, isArray: true })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => RecurringJournalEntryLineDto)
  lines!: RecurringJournalEntryLineDto[];
}
