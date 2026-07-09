import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@africahr/platform-database';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
