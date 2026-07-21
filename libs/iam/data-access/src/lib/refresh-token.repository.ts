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

export interface RefreshTokenForLookup {
  id: string;
  tenantId: string | null;
  userId: string;
  expiresAt: Date;
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
   * known tenant. Goes through find_refresh_token_by_hash(), a narrow
   * SECURITY DEFINER function, rather than a plain findFirst — under the
   * least-privilege app role a bare query can't see tenant-scoped rows with
   * no tenant context set (and can't safely fake one on a pooled
   * connection either, see tenant-scoped.ts) — see the
   * refresh-token-lookup-function migration.
   */
  async findByTokenHash(tokenHash: string): Promise<RefreshTokenForLookup | null> {
    const rows = await this.prisma.$queryRaw<
      RefreshTokenForLookup[]
    >`SELECT * FROM find_refresh_token_by_hash(${tokenHash})`;
    return rows[0] ?? null;
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
