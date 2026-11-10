import { ApiProperty } from '@nestjs/swagger';
import { CompanyAssetAssignmentResponseDto } from './company-asset-assignment-response.dto';
import { CompanyAssetResponseDto } from './company-asset-response.dto';

export class MyCompanyAssetResponseDto extends CompanyAssetAssignmentResponseDto {
  @ApiProperty({ type: CompanyAssetResponseDto })
  asset!: CompanyAssetResponseDto;
}
