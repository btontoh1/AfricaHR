import { RedisService } from '@africahr/platform-redis';
import { TokenRevocationService } from './token-revocation.service';

describe('TokenRevocationService', () => {
  let service: TokenRevocationService;
  let client: { set: jest.Mock; get: jest.Mock };
  let redis: jest.Mocked<RedisService>;

  beforeEach(() => {
    client = { set: jest.fn(), get: jest.fn() };
    redis = { getClient: jest.fn().mockReturnValue(client) } as unknown as jest.Mocked<RedisService>;
    service = new TokenRevocationService(redis);
  });

  describe('revokeAllForUser', () => {
    it('writes a revocation timestamp keyed by user with an expiry', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);

      await service.revokeAllForUser('user-1');

      expect(client.set).toHaveBeenCalledWith('auth:revoked-since:user-1', '1700000000', 'EX', 20 * 60);
    });

    it('does not throw when Redis is unavailable', async () => {
      client.set.mockRejectedValue(new Error('connection lost'));

      await expect(service.revokeAllForUser('user-1')).resolves.toBeUndefined();
    });
  });

  describe('isRevoked', () => {
    it('returns false when there is no revocation recorded for the user', async () => {
      client.get.mockResolvedValue(null);

      await expect(service.isRevoked('user-1', 1_700_000_000)).resolves.toBe(false);
    });

    it('returns true when the token was issued at or before the revocation time', async () => {
      client.get.mockResolvedValue('1700000000');

      await expect(service.isRevoked('user-1', 1_699_999_999)).resolves.toBe(true);
      await expect(service.isRevoked('user-1', 1_700_000_000)).resolves.toBe(true);
    });

    it('returns false when the token was issued after the revocation time', async () => {
      client.get.mockResolvedValue('1700000000');

      await expect(service.isRevoked('user-1', 1_700_000_001)).resolves.toBe(false);
    });

    it('fails open (treats as not revoked) when Redis is unavailable', async () => {
      client.get.mockRejectedValue(new Error('connection lost'));

      await expect(service.isRevoked('user-1', 1_700_000_000)).resolves.toBe(false);
    });
  });
});
