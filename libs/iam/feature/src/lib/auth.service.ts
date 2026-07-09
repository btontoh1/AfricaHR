import { randomBytes, createHash } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtTokenService, SystemRole } from '@africahr/platform-auth';
import { AuditService } from '@africahr/platform-audit';
import { RefreshTokenRepository, UserRepository } from '@africahr/iam-data-access';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';

const REFRESH_TOKEN_TTL_DAYS = 30;

export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: JwtTokenService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, context: RequestContext = {}): Promise<AuthResponseDto> {
    const user = await this.users.findByEmail(dto.email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.users.updateLastLogin(user.tenantId, user.id);

    const response = await this.issueTokenPair(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      context,
    );

    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.id,
      action: 'auth.login',
      resourceType: 'User',
      resourceId: user.id,
    });

    return response;
  }

  async refresh(refreshToken: string, context: RequestContext = {}): Promise<AuthResponseDto> {
    const tokenHash = this.hashToken(refreshToken);
    const existing = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!existing || existing.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.users.findById(existing.tenantId, existing.userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.refreshTokens.revoke(existing.tenantId, existing.id);

    const response = await this.issueTokenPair(
      { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
      context,
    );

    await this.audit.record({
      tenantId: user.tenantId,
      actorUserId: user.id,
      action: 'auth.token_refreshed',
      resourceType: 'User',
      resourceId: user.id,
    });

    return response;
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    const existing = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!existing) {
      return;
    }

    await this.refreshTokens.revoke(existing.tenantId, existing.id);

    await this.audit.record({
      tenantId: existing.tenantId,
      actorUserId: existing.userId,
      action: 'auth.logout',
      resourceType: 'User',
      resourceId: existing.userId,
    });
  }

  private async issueTokenPair(
    user: { id: string; email: string; role: SystemRole; tenantId: string | null },
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    });

    const rawRefreshToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

    await this.refreshTokens.create({
      tenantId: user.tenantId,
      userId: user.id,
      tokenHash: this.hashToken(rawRefreshToken),
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
