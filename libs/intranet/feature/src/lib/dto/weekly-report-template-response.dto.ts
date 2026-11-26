import { ApiProperty } from '@nestjs/swagger';

export class WeeklyReportTemplateResponseDto {
  @ApiProperty() organizationUnitId!: string;
  @ApiProperty({ type: [String] }) questions!: string[];
  @ApiProperty({ description: 'True when this department has no custom template and is using the default questions' })
  isDefault!: boolean;
}
