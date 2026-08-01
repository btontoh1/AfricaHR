import type { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AppConfigService } from '@africahr/platform-core';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
  const mockedGetSignedUrl = getSignedUrl as jest.Mock;
  const config = { storage: { bucket: 'test-bucket' } } as unknown as AppConfigService;

  beforeEach(() => {
    mockedGetSignedUrl.mockReset();
  });

  function createService(client: Partial<S3Client> = {}) {
    return new StorageService(client as S3Client, config);
  }

  describe('getUploadUrl', () => {
    it('returns a signed PUT URL for the configured bucket', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://storage.example/upload');
      const service = createService();

      const url = await service.getUploadUrl('orgs/tenant-1/org-1/doc.pdf', 'application/pdf');

      expect(url).toBe('https://storage.example/upload');
      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'orgs/tenant-1/org-1/doc.pdf',
            ContentType: 'application/pdf',
          }),
        }),
        { expiresIn: 15 * 60 },
      );
    });
  });

  describe('getViewUrl', () => {
    it('returns a signed GET URL for the configured bucket', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://storage.example/view');
      const service = createService();

      const url = await service.getViewUrl('orgs/tenant-1/org-1/doc.pdf');

      expect(url).toBe('https://storage.example/view');
      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({ Bucket: 'test-bucket', Key: 'orgs/tenant-1/org-1/doc.pdf' }),
        }),
        { expiresIn: 15 * 60 },
      );
    });
  });

  describe('deleteObject', () => {
    it('sends a DeleteObjectCommand for the key', async () => {
      const send = jest.fn().mockResolvedValue(undefined);
      const service = createService({ send });

      await service.deleteObject('orgs/tenant-1/org-1/doc.pdf');

      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0].input).toMatchObject({
        Bucket: 'test-bucket',
        Key: 'orgs/tenant-1/org-1/doc.pdf',
      });
    });
  });

  describe('getStorageUsage', () => {
    it('sums size and count across a single page of objects', async () => {
      const send = jest.fn().mockResolvedValue({
        Contents: [{ Size: 100 }, { Size: 250 }],
        IsTruncated: false,
      });
      const service = createService({ send });

      const usage = await service.getStorageUsage();

      expect(usage).toEqual({ usedBytes: 350, objectCount: 2 });
      expect(send).toHaveBeenCalledTimes(1);
    });

    it('paginates across multiple pages via ContinuationToken', async () => {
      const send = jest
        .fn()
        .mockResolvedValueOnce({
          Contents: [{ Size: 100 }],
          IsTruncated: true,
          NextContinuationToken: 'token-2',
        })
        .mockResolvedValueOnce({
          Contents: [{ Size: 200 }, { Size: 300 }],
          IsTruncated: false,
        });
      const service = createService({ send });

      const usage = await service.getStorageUsage();

      expect(usage).toEqual({ usedBytes: 600, objectCount: 3 });
      expect(send).toHaveBeenCalledTimes(2);
      expect(send.mock.calls[1][0].input).toMatchObject({ ContinuationToken: 'token-2' });
    });

    it('handles an empty bucket', async () => {
      const send = jest.fn().mockResolvedValue({ Contents: undefined, IsTruncated: false });
      const service = createService({ send });

      await expect(service.getStorageUsage()).resolves.toEqual({ usedBytes: 0, objectCount: 0 });
    });
  });
});
