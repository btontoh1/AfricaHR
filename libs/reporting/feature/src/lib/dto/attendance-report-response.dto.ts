import { ApiProperty } from '@nestjs/swagger';

export class AttendanceReportResponseDto {
  @ApiProperty() recordCount!: number;
  @ApiProperty() employeeCount!: number;
  @ApiProperty() totalHoursWorked!: number;
  @ApiProperty() totalOvertimeHours!: number;
}
