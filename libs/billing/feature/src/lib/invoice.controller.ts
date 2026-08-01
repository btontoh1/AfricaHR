import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { InvoiceService } from './invoice.service';
import { InvoiceResponseDto } from './dto/invoice-response.dto';

@ApiTags('billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_BILLING_MANAGE)
@Controller('tenants/:tenantId/invoices')
export class InvoiceController {
  constructor(private readonly invoices: InvoiceService) {}

  @Get()
  @ApiOkResponse({ type: InvoiceResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string) {
    return this.invoices.listForTenant(tenantId);
  }

  @Post()
  @ApiOperation({
    summary: 'Generate an invoice for the current billing period at the tenant\'s current headcount',
  })
  @ApiOkResponse({ type: InvoiceResponseDto })
  generate(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    return this.invoices.generate(tenantId, actor.sub);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Manually mark an invoice paid (e.g. payment collected outside Paystack)' })
  @ApiOkResponse({ type: InvoiceResponseDto })
  markPaid(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.invoices.markPaidManually(tenantId, id, actor.sub);
  }
}
