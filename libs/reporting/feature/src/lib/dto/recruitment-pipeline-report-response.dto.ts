import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStage } from '@prisma/client';

export class ApplicationsByStageResponseDto {
  @ApiProperty({ enum: Object.values(ApplicationStage) }) stage!: ApplicationStage;
  @ApiProperty() count!: number;
}

export class RecruitmentPipelineReportResponseDto {
  @ApiProperty() openRequisitions!: number;
  @ApiProperty({ type: ApplicationsByStageResponseDto, isArray: true })
  applicationsByStage!: ApplicationsByStageResponseDto[];
  @ApiProperty() averageTimeToHireDays!: number;
}
