import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { withScope } from './tenant-scoped';

@Injectable()
export class MfaTrustedDeviceRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string | null, userId: string, tokenHash: string, expiresAt: Date): Promise<{ id: string }> {
    return withScope(this.prisma, tenantId, (client) =>
      client.mfaTrustedDevice.create({
        data: { tenantId, userId, tokenHash, expiresAt },
        select: { id: true },
      }),
    );
  }

  /** Only matches a record for this exact user that hasn't expired yet. */
  findValid(tenantId: string | null, userId: string, tokenHash: string): Promise<{ id: string } | null> {
    return withScope(this.prisma, tenantId, (client) =>
      client.mfaTrustedDevice.findFirst({
        where: { userId, tokenHash, expiresAt: { gt: new Date() } },
        select: { id: true },
      }),
    );
  }

  deleteAllForUser(tenantId: string | null, userId: string): Promise<Prisma.BatchPayload> {
    return withScope(this.prisma, tenantId, (client) =>
      client.mfaTrustedDevice.deleteMany({ where: { userId } }),
    );
  }
}
