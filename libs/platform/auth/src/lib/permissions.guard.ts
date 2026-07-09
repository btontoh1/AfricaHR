import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_METADATA_KEY } from './require-permissions.decorator';
import { hasPermission, Permission } from './system-role';
import { AuthenticatedRequest } from './jwt-auth.guard';

/**
 * Must run after JwtAuthGuard (relies on request.user being populated).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const missing = required.filter((permission) => !hasPermission(user.role, permission));

    if (missing.length > 0) {
      throw new ForbiddenException(`Missing required permission(s): ${missing.join(', ')}`);
    }

    return true;
  }
}
