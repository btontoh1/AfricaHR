import { ForbiddenException } from '@nestjs/common';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { AttendanceKioskController } from './attendance-kiosk.controller';
import { AttendanceKioskService } from './attendance-kiosk.service';

describe('AttendanceKioskController', () => {
  let controller: AttendanceKioskController;
  let service: jest.Mocked<AttendanceKioskService>;

  const kioskActor: RequestUser = {
    sub: 'kiosk-device-1',
    email: 'kiosk@acme.com',
    role: SystemRole.KIOSK,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  beforeEach(() => {
    service = {
      listEmployees: jest.fn(),
      clock: jest.fn(),
    } as unknown as jest.Mocked<AttendanceKioskService>;

    controller = new AttendanceKioskController(service);
  });

  it('lists employees within the route tenant', () => {
    controller.listEmployees('tenant-1', kioskActor);

    expect(service.listEmployees).toHaveBeenCalledWith('tenant-1');
  });

  it('rejects an actor acting on a different tenant', () => {
    expect(() => controller.listEmployees('tenant-2', kioskActor)).toThrow(ForbiddenException);
  });

  it('delegates clock with tenant, employeeId, and pin', () => {
    controller.clock('tenant-1', { employeeId: 'emp-1', pin: '4821' }, kioskActor);

    expect(service.clock).toHaveBeenCalledWith('tenant-1', 'emp-1', '4821');
  });
});
