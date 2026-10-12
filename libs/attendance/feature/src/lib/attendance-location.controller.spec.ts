import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AttendanceLocationController } from './attendance-location.controller';
import { AttendanceLocationService } from './attendance-location.service';

describe('AttendanceLocationController', () => {
  let controller: AttendanceLocationController;
  let service: jest.Mocked<AttendanceLocationService>;

  const hrManager: RequestUser = {
    sub: 'hr-1',
    email: 'hr@acme.com',
    role: SystemRole.HR_MANAGER,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const employee: RequestUser = {
    sub: 'emp-user-1',
    email: 'ama@acme.com',
    role: SystemRole.EMPLOYEE,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<AttendanceLocationService>;
    controller = new AttendanceLocationController(service);
  });

  it('allows an EMPLOYEE-role actor to list locations (no permission gate)', () => {
    controller.list('tenant-1', employee);

    expect(service.list).toHaveBeenCalledWith('tenant-1');
  });

  it('creates within the route tenant when the actor matches', () => {
    const dto = { name: 'HQ', latitude: 5.6, longitude: -0.19, radiusMeters: 150 } as never;

    controller.create('tenant-1', dto, hrManager);

    expect(service.create).toHaveBeenCalledWith('tenant-1', dto, 'hr-1');
  });

  it('updates within the route tenant when the actor matches', () => {
    const dto = { name: 'Renamed' } as never;

    controller.update('tenant-1', 'loc-1', dto, hrManager);

    expect(service.update).toHaveBeenCalledWith('tenant-1', 'loc-1', dto, 'hr-1');
  });

  it('removes within the route tenant when the actor matches', () => {
    controller.remove('tenant-1', 'loc-1', hrManager);

    expect(service.delete).toHaveBeenCalledWith('tenant-1', 'loc-1', 'hr-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.list('tenant-2', hrManager)).toThrow(ForbiddenException);
  });
});
