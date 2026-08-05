import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Permission, PermissionsGuard, RequirePermissions } from '@africahr/platform-auth';
import { PlatformDisbursementService } from './platform-disbursement.service';
import { DisbursementAttentionResponseDto } from './dto/disbursement-attention-response.dto';

@ApiTags('payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_DISBURSEMENT_READ)
@Controller('platform-admin/disbursements')
export class PlatformDisbursementController {
  constructor(private readonly disbursements: PlatformDisbursementService) {}

  @Get()
  @ApiOperation({
    summary: 'Cross-tenant payslip disbursements needing attention (stuck PENDING or FAILED)',
  })
  @ApiOkResponse({ type: DisbursementAttentionResponseDto })
  list() {
    return this.disbursements.listNeedingAttention();
  }
}
