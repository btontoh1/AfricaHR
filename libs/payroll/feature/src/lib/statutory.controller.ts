import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Permission,
  PermissionsGuard,
  RequestUser,
  RequirePermissions,
} from '@africahr/platform-auth';
import { StatutoryDataService } from './statutory-data.service';
import { CreateStatutoryTaxBandDto } from './dto/create-statutory-tax-band.dto';
import { CreateStatutoryRateDto } from './dto/create-statutory-rate.dto';

/**
 * Platform-admin only: GRA/SSNIT reference data is national tax law, not
 * tenant-configurable (see project memory for that decision).
 */
@ApiTags('payroll-statutory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions(Permission.PLATFORM_PAYROLL_CONFIG_MANAGE)
@Controller('payroll/statutory')
export class StatutoryController {
  constructor(private readonly statutory: StatutoryDataService) {}

  @Post('tax-bands')
  createTaxBand(@Body() dto: CreateStatutoryTaxBandDto, @CurrentUser() actor: RequestUser) {
    return this.statutory.createTaxBand(dto, actor.sub);
  }

  @Get('tax-bands')
  listTaxBands(@Query('countryCode') countryCode: string) {
    return this.statutory.listTaxBands(countryCode);
  }

  @Post('rates')
  createRate(@Body() dto: CreateStatutoryRateDto, @CurrentUser() actor: RequestUser) {
    return this.statutory.createRate(dto, actor.sub);
  }

  @Get('rates')
  listRates(@Query('countryCode') countryCode: string) {
    return this.statutory.listRates(countryCode);
  }
}
