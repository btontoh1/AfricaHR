import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsNumber, IsOptional, IsString, IsUUID, Length, Min, ValidateNested } from 'class-validator';

export class CreatePurchaseRequisitionLineDto {
  @ApiProperty()
  @IsUUID()
  productId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.000001)
  quantity!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedUnitCost?: number;
}

export class CreatePurchaseRequisitionDto {
  @ApiProperty()
  @IsUUID()
  warehouseId!: string;

  @ApiProperty({ description: 'The employee this requisition is raised on behalf of' })
  @IsUUID()
  requestedByEmployeeId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  notes?: string;

  @ApiProperty({ type: CreatePurchaseRequisitionLineDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseRequisitionLineDto)
  lines!: CreatePurchaseRequisitionLineDto[];
}
