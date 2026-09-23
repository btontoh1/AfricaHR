import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { GlAccountCode } from '@africahr/finance-domain';

const ACCOUNT_CODE_VALUES = Object.values(GlAccountCode);

export class ManualJournalEntryLineDto {
  @ApiProperty({ enum: ACCOUNT_CODE_VALUES })
  @IsIn(ACCOUNT_CODE_VALUES)
  accountCode!: GlAccountCode;

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

export class CreateManualJournalEntryDto {
  @ApiProperty()
  @IsUUID()
  organizationId!: string;

  @ApiProperty()
  @IsDateString()
  entryDate!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 500)
  description!: string;

  @ApiProperty({ example: 'GHS' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiProperty({ type: ManualJournalEntryLineDto, isArray: true })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => ManualJournalEntryLineDto)
  lines!: ManualJournalEntryLineDto[];
}
