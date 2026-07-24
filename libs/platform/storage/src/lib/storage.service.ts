import { Inject, Injectable } from '@nestjs/common';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '@africahr/platform-core';
import { STORAGE_CLIENT } from './storage.constants';

const DEFAULT_EXPIRY_SECONDS = 15 * 60;

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
}
