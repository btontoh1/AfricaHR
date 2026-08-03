import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';
import { assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser } from '@africahr/platform-auth';
import { PaymentMethodService } from './payment-method.service';
import { UpsertPaymentMethodDto } from './dto/upsert-payment-method.dto';
import { PaymentMethodResponseDto } from './dto/payment-method-response.dto';
import { BankOptionResponseDto } from './dto/bank-option-response.dto';

/**
 * Self-service: no @RequirePermissions on this controller — any
 * authenticated tenant member may maintain their own payment details
 * regardless of role, same as attendance/leave/payslip "me" endpoints.
 * PaymentMethodService resolves "own" via Employee.userId and 403s if the
 * caller has no linked Employee record. The route already has an extra
 * "payment-method" segment beyond EmployeeController's :id param, so it
 * can't collide with that controller's routes regardless of module
 * registration order (unlike the other "me" controllers, which need to be
 * registered first).
 */
@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/employees/me/payment-method')
export class MyPaymentMethodController {
  constructor(private readonly paymentMethods: PaymentMethodService) {}

  @Get()
  @ApiOkResponse({ type: PaymentMethodResponseDto })
  get(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.paymentMethods.getForSelf(tenantId, actor.sub);
  }

  @Put()
  @ApiOkResponse({ type: PaymentMethodResponseDto })
  upsert(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpsertPaymentMethodDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.paymentMethods.upsertForSelf(tenantId, actor.sub, dto);
  }

  /** Bank/mobile-money-provider options for the "bankCode" picker, scoped to the caller's own country - see PaymentMethodService.listBanksForSelf. */
  @Get('banks')
  @ApiQuery({ name: 'type', enum: Object.values(PaymentMethodType) })
  @ApiOkResponse({ type: BankOptionResponseDto, isArray: true })
  listBanks(
    @Param('tenantId') tenantId: string,
    @Query('type') type: PaymentMethodType,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.paymentMethods.listBanksForSelf(tenantId, actor.sub, type);
  }
}
