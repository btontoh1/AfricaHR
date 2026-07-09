import { AppConfigService } from '@africahr/platform-core';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    const config = {
      databaseUrl: 'postgresql://user:pass@localhost:5432/africahr_test',
    } as AppConfigService;

    service = new PrismaService(config);
  });

  describe('withTenantContext', () => {
    it('sets the tenant GUC and runs the callback inside the same transaction', async () => {
      const executeRaw = jest.fn().mockResolvedValue(undefined);
      const fakeTx = { $executeRaw: executeRaw };

      jest
        .spyOn(service, '$transaction')
        .mockImplementation(async (fn: unknown) =>
          (fn as (tx: typeof fakeTx) => Promise<unknown>)(fakeTx),
        );

      const callback = jest.fn().mockResolvedValue('result');

      const result = await service.withTenantContext('tenant-123', callback);

      expect(result).toBe('result');
      expect(executeRaw).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(fakeTx);
    });
  });
});
