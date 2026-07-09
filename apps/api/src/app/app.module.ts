import { Module } from '@nestjs/common';
import { CoreModule } from '@africahr/platform-core';
import { HealthModule } from '@africahr/platform-health';

@Module({
  imports: [CoreModule, HealthModule],
})
export class AppModule {}
