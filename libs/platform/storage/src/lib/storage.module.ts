import { Global, Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { AppConfigModule, AppConfigService } from '@africahr/platform-core';
import { STORAGE_CLIENT } from './storage.constants';
import { StorageService } from './storage.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: STORAGE_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => {
        const { endpoint, region, accessKey, secretKey, forcePathStyle } = config.storage;
        return new S3Client({
          endpoint,
          region,
          forcePathStyle,
          credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        });
      },
    },
    StorageService,
  ],
  exports: [STORAGE_CLIENT, StorageService],
})
export class StorageModule {}
