import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permission, SystemRole } from './system-role';

describe('PermissionsGuard', () => {
  function contextWithUser(role: SystemRole): ExecutionContext {
    const request = { user: { role } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => undefined,
      getClass: () => undefined,
    } as unknown as ExecutionContext;
  }

  function guardWithRequired(required: Permission[] | undefined): PermissionsGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new PermissionsGuard(reflector);
  }

  it('allows the request through when no permissions are required', () => {
    const guard = guardWithRequired(undefined);

    expect(guard.canActivate(contextWithUser(SystemRole.EMPLOYEE))).toBe(true);
  });

  it('allows the request through when the role has the required permission', () => {
    const guard = guardWithRequired([Permission.USER_READ]);

    expect(guard.canActivate(contextWithUser(SystemRole.HR_MANAGER))).toBe(true);
  });

  it('throws ForbiddenException when the role lacks a required permission', () => {
    const guard = guardWithRequired([Permission.USER_MANAGE]);

    expect(() => guard.canActivate(contextWithUser(SystemRole.HR_MANAGER))).toThrow(
      ForbiddenException,
    );
  });
});
