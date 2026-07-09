import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { withScope } from './tenant-scoped';

export interface CreateRefreshTokenInput {
  tenantId: string | null;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateRefreshTokenInput): Promise<RefreshToken> {
    return withScope(this.prisma, input.tenantId, (client) =>
      client.refreshToken.create({
        data: {
          tenantId: input.tenantId,
          userId: input.userId,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        },
      }),
    );
  }

  /**
   * Deliberately bypasses tenant scoping, same reasoning as
   * UserRepository.findByEmail: refresh only has an opaque token, not yet a
   * known tenant.
   */
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({ where: { tokenHash, revokedAt: null } });
  }

  revoke(tenantId: string | null, id: string): Promise<RefreshToken> {
    return withScope(this.prisma, tenantId, (client) =>
      client.refreshToken.update({ where: { id }, data: { revokedAt: new Date() } }),
    );
  }

  revokeAllForUser(tenantId: string | null, userId: string): Promise<Prisma.BatchPayload> {
    return withScope(this.prisma, tenantId, (client) =>
      client.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    );
  }
}
