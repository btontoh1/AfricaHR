import { Body, Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  assertTenantScope,
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { TenantPayrollWalletService } from './tenant-payroll-wallet.service';
import { WalletBalanceResponseDto } from './dto/wallet-balance-response.dto';
import { WalletTopUpResponseDto } from './dto/wallet-topup-response.dto';
import { RequestWalletTopUpDto } from './dto/request-wallet-topup.dto';

@ApiTags('payroll-wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tenants/:tenantId/payroll-wallet')
export class TenantPayrollWalletController {
  constructor(private readonly wallet: TenantPayrollWalletService) {}

  @Get('balances')
  @RequirePermissions(Permission.PAYROLL_WALLET_READ)
  @ApiOkResponse({ type: WalletBalanceResponseDto, isArray: true })
  async balances(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    const wallets = await this.wallet.listBalances(tenantId);
    return wallets.map((w) => ({ currency: w.currency, balance: Number(w.balance) }));
  }

  @Get('top-ups')
  @RequirePermissions(Permission.PAYROLL_WALLET_READ)
  @ApiOkResponse({ type: WalletTopUpResponseDto, isArray: true })
  listTopUps(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.wallet.listTopUps(tenantId);
  }

  @Post('top-ups')
  @RequirePermissions(Permission.PAYROLL_WALLET_MANAGE)
  @ApiOperation({ summary: 'Starts a Paystack checkout to fund the tenant payroll wallet for one currency' })
  @ApiOkResponse({ type: WalletTopUpResponseDto })
  requestTopUp(
    @Param('tenantId') tenantId: string,
    @Body() dto: RequestWalletTopUpDto,
    @CurrentUser() actor: RequestUser,
  ) {
    assertTenantScope(actor, tenantId);
    return this.wallet.requestTopUp(tenantId, dto.currency, dto.amount, actor.sub);
  }
}
