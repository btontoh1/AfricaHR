import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import {
  AddOnGuard,
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequireAddOn,
  RequirePermissions,
} from '@africahr/platform-auth';
import { CustomerInvoiceService } from './customer-invoice.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { CreateCustomerInvoiceDto } from './dto/create-customer-invoice.dto';
import { UpdateCustomerInvoiceDto } from './dto/update-customer-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { CustomerInvoiceResponseDto } from './dto/customer-invoice-response.dto';

// "customer-invoices", not "invoices" - libs/billing/feature's
// InvoiceController already owns tenants/:tenantId/invoices for ParotHR's
// own platform-to-tenant subscription billing, a completely different
// concern from this organization-to-its-own-customers billing tool. Sharing
// that path would silently shadow one controller's routes with the other's.
@ApiTags('customer-invoices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVOICING)
@Controller('tenants/:tenantId/customer-invoices')
export class CustomerInvoiceController {
  constructor(
    private readonly invoices: CustomerInvoiceService,
    private readonly pdf: InvoicePdfService,
  ) {}

  @Post()
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @ApiOkResponse({ type: CustomerInvoiceResponseDto })
  create(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateCustomerInvoiceDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.invoices.create(tenantId, dto, actor);
  }

  @Get()
  @RequirePermissions(Permission.INVOICING_READ)
  @ApiOkResponse({ type: CustomerInvoiceResponseDto, isArray: true })
  @ApiQuery({ name: 'organizationId', required: false })
  list(
    @Param('tenantId') tenantId: string,
    @CurrentUser() actor: RequestUser,
    @Query('organizationId') organizationId?: string,
  ) {
    assertTenantScope(actor, tenantId);
    return this.invoices.list(tenantId, organizationId, actor);
  }

  @Get(':id')
  @RequirePermissions(Permission.INVOICING_READ)
  @ApiOkResponse({ type: CustomerInvoiceResponseDto })
  findById(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.invoices.findById(tenantId, id, actor);
  }

  @Patch(':id')
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @ApiOkResponse({ type: CustomerInvoiceResponseDto })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerInvoiceDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.invoices.update(tenantId, id, dto, actor);
  }

  @Patch(':id/status')
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @ApiOkResponse({ type: CustomerInvoiceResponseDto })
  updateStatus(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.invoices.updateStatus(tenantId, id, dto.status, actor);
  }

  @Delete(':id')
  @RequirePermissions(Permission.INVOICING_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async softDelete(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    await this.invoices.softDelete(tenantId, id, actor);
  }

  // download=true sends Content-Disposition: attachment (browser saves the
  // file); the default (inline) opens in the browser's own PDF viewer,
  // which is what "printable" actually means here - the viewer's own print
  // button, not a second bespoke print code path.
  @Get(':id/pdf')
  @RequirePermissions(Permission.INVOICING_READ)
  async downloadPdf(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() actor: RequestUser,
    @Res() res: Response,
    @Query('download') download?: string,
  ): Promise<void> {
    assertTenantScope(actor, tenantId);
    const invoice = await this.invoices.findInvoiceOrThrow(tenantId, id, actor);
    const pdfBuffer = await this.pdf.render(invoice);

    const disposition = download === 'true' ? 'attachment' : 'inline';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }
}
