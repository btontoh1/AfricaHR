import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AddOnModule } from '@prisma/client';
import { AddOnGuard, assertTenantScope, CurrentUser, JwtAuthGuard, PermissionsGuard, RequestUser, RequireAddOn } from '@africahr/platform-auth';
import { CompanyAssetService } from './company-asset.service';
import { MyCompanyAssetResponseDto } from './dto/my-company-asset-response.dto';

/**
 * Self-service, read-only: no @RequirePermissions - any authenticated
 * tenant member can see which company assets are (or have been) assigned
 * to them. Registered before CompanyAssetController in the module so this
 * literal "/me" path is matched before that controller's "/:id" route -
 * same convention as MyLeaveRequestController/MyStockRequestController.
 */
@ApiTags('inventory-assets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, AddOnGuard)
@RequireAddOn(AddOnModule.INVENTORY)
@Controller('tenants/:tenantId/inventory/assets/me')
export class MyCompanyAssetController {
  constructor(private readonly assets: CompanyAssetService) {}

  @Get()
  @ApiOkResponse({ type: MyCompanyAssetResponseDto, isArray: true })
  list(@Param('tenantId') tenantId: string, @CurrentUser() actor: RequestUser) {
    assertTenantScope(actor, tenantId);
    return this.assets.listForSelf(tenantId, actor.sub);
  }
}
