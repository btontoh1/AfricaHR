import { AuditLogRepository } from '@africahr/tenancy-data-access';
import { PlatformAuditLogService } from './platform-audit-log.service';

describe('PlatformAuditLogService', () => {
  let service: PlatformAuditLogService;
  let auditLogs: jest.Mocked<AuditLogRepository>;

  beforeEach(() => {
    auditLogs = { list: jest.fn() } as unknown as jest.Mocked<AuditLogRepository>;
    service = new PlatformAuditLogService(auditLogs);
  });

  it('separates limit/offset from the filter fields before calling the repository', async () => {
    auditLogs.list.mockResolvedValue({ items: [], totalCount: 0 });

    await service.list({ tenantId: 'tenant-1', action: 'role_changed', limit: 25, offset: 10 });

    expect(auditLogs.list).toHaveBeenCalledWith({ tenantId: 'tenant-1', action: 'role_changed' }, 25, 10);
  });

  it('passes undefined limit/offset through when omitted', async () => {
    auditLogs.list.mockResolvedValue({ items: [], totalCount: 0 });

    await service.list({});

    expect(auditLogs.list).toHaveBeenCalledWith({}, undefined, undefined);
  });
});
