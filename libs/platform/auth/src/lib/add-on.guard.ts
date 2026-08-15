import { CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AddOnModule } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { ADD_ON_METADATA_KEY } from './require-add-on.decorator';
import { SystemRole } from './system-role';
import { AuthenticatedRequest } from './jwt-auth.guard';

/**
 * Gates a route behind a paid, platform-admin-toggled add-on
 * (Tenant.enabledAddOns) - orthogonal to role-based PermissionsGuard.
 * PLATFORM_ADMIN always bypasses (same convention as assertTenantScope),
 * since they operate the platform regardless of any one tenant's paid
 * entitlements.
 *
 * Must run after JwtAuthGuard (relies on request.user) and expects a
 * :tenantId route param, same as assertTenantScope's callers.
 */
@Injectable()
export class AddOnGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<AddOnModule>(ADD_ON_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user.role === SystemRole.PLATFORM_ADMIN) {
      return true;
    }

    const tenantId = request.params['tenantId'];
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { enabledAddOns: true },
    });
    if (!tenant) {
      throw new NotFoundException(`Tenant "${tenantId}" not found`);
    }

    if (!tenant.enabledAddOns.includes(required)) {
      throw new ForbiddenException(
        `This feature isn't enabled for your organization. Contact your platform admin to enable it.`,
      );
    }

    return true;
  }
}
