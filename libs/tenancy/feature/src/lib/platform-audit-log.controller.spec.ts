import { PlatformAuditLogController } from './platform-audit-log.controller';
import { PlatformAuditLogService } from './platform-audit-log.service';

describe('PlatformAuditLogController', () => {
  let controller: PlatformAuditLogController;
  let auditLogs: jest.Mocked<PlatformAuditLogService>;

  beforeEach(() => {
    auditLogs = { list: jest.fn() } as unknown as jest.Mocked<PlatformAuditLogService>;
    controller = new PlatformAuditLogController(auditLogs);
  });

  it('delegates to PlatformAuditLogService.list with parsed filters', async () => {
    auditLogs.list.mockResolvedValue({ items: [], totalCount: 0 });

    await controller.list(
      'tenant-1',
      'user-1',
      'role_changed',
      'User',
      '2026-08-01T00:00:00.000Z',
      '2026-08-05T00:00:00.000Z',
      '25',
      '10',
    );

    expect(auditLogs.list).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      actorUserId: 'user-1',
      action: 'role_changed',
      resourceType: 'User',
      from: new Date('2026-08-01T00:00:00.000Z'),
      to: new Date('2026-08-05T00:00:00.000Z'),
      limit: 25,
      offset: 10,
    });
  });

  it('passes undefined for every unset filter and pagination param', async () => {
    auditLogs.list.mockResolvedValue({ items: [], totalCount: 0 });

    await controller.list();

    expect(auditLogs.list).toHaveBeenCalledWith({
      tenantId: undefined,
      actorUserId: undefined,
      action: undefined,
      resourceType: undefined,
      from: undefined,
      to: undefined,
      limit: undefined,
      offset: undefined,
    });
  });
});
