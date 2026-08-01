import { Inject, Injectable } from '@nestjs/common';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '@africahr/platform-core';
import { STORAGE_CLIENT } from './storage.constants';

const DEFAULT_EXPIRY_SECONDS = 15 * 60;

export interface StorageUsage {
  usedBytes: number;
  objectCount: number;
}

/**
 * Every file transfer goes browser <-> storage directly via a short-lived
 * signed URL, never through the API - the Next.js proxy's generic
 * `/api/[...path]` route reads every request body with `await
 * request.text()`, which is lossy for binary data, so it can never carry a
 * file. This service only ever hands out URLs, never bytes.
 */
@Injectable()
export class StorageService {
  private readonly bucket: string;

  constructor(
    @Inject(STORAGE_CLIENT) private readonly client: S3Client,
    config: AppConfigService,
  ) {
    this.bucket = config.storage.bucket;
  }

  getUploadUrl(key: string, contentType: string, expiresInSeconds = DEFAULT_EXPIRY_SECONDS): Promise<string> {
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  getViewUrl(key: string, expiresInSeconds = DEFAULT_EXPIRY_SECONDS): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  /**
   * Sums size/count across every object in the bucket - for an operational
   * dashboard widget, not anything tenant-scoped (this bucket holds every
   * tenant's uploads together, prefixed by tenantId, not one bucket per
   * tenant). Paginates via ContinuationToken since ListObjectsV2 caps each
   * response at 1000 keys.
   */
  async getStorageUsage(): Promise<StorageUsage> {
    let usedBytes = 0;
    let objectCount = 0;
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: continuationToken,
        }),
      );

      for (const object of response.Contents ?? []) {
        usedBytes += object.Size ?? 0;
        objectCount += 1;
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return { usedBytes, objectCount };
  }
}
