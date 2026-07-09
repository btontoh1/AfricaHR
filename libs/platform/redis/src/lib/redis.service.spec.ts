import type Redis from 'ioredis';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  function createService(client: Partial<Redis>) {
    return new RedisService(client as Redis);
  }

  describe('ping', () => {
    it('returns true when the client responds PONG', async () => {
      const service = createService({ ping: jest.fn().mockResolvedValue('PONG') });

      await expect(service.ping()).resolves.toBe(true);
    });

    it('returns false when the client throws', async () => {
      const service = createService({
        ping: jest.fn().mockRejectedValue(new Error('connection refused')),
      });

      await expect(service.ping()).resolves.toBe(false);
    });
  });

  describe('onModuleDestroy', () => {
    it('disconnects the underlying client', async () => {
      const disconnect = jest.fn();
      const service = createService({ disconnect });

      await service.onModuleDestroy();

      expect(disconnect).toHaveBeenCalledTimes(1);
    });
  });
});
