import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { withScope } from './tenant-scoped';

@Injectable()
export class MfaBackupCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  createMany(tenantId: string | null, userId: string, codeHashes: string[]): Promise<Prisma.BatchPayload> {
    return withScope(this.prisma, tenantId, (client) =>
      client.mfaBackupCode.createMany({
        data: codeHashes.map((codeHash) => ({ tenantId, userId, codeHash })),
      }),
    );
  }

  deleteAllForUser(tenantId: string | null, userId: string): Promise<Prisma.BatchPayload> {
    return withScope(this.prisma, tenantId, (client) =>
      client.mfaBackupCode.deleteMany({ where: { userId } }),
    );
  }
}
