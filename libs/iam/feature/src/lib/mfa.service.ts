import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { RequestUser, TokenRevocationService } from '@africahr/platform-auth';
import { AppConfigService } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import { MfaBackupCodeRepository, RefreshTokenRepository, UserRepository } from '@africahr/iam-data-access';
import {
  buildTotpUri,
  decryptMfaSecret,
  deriveMfaEncryptionKey,
  encryptMfaSecret,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  verifyTotpCode,
} from '@africahr/iam-domain';

@Injectable()
export class MfaService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly users: UserRepository,
    private readonly backupCodes: MfaBackupCodeRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly revocation: TokenRevocationService,
    private readonly audit: AuditService,
    config: AppConfigService,
  ) {
    // Derived once at construction (Nest instantiates providers eagerly),
    // so a missing/malformed MFA_ENCRYPTION_KEY fails the app's boot with a
    // clear error rather than surfacing as a confusing 500 on first use.
    this.encryptionKey = deriveMfaEncryptionKey(config.mfaEncryptionKey);
  }

  async getStatus(actor: RequestUser): Promise<{ enabled: boolean }> {
    const user = await this.findActorUser(actor);
    return { enabled: user.mfaEnabled };
  }

  async setup(actor: RequestUser): Promise<{ secret: string; otpauthUri: string }> {
    const user = await this.findActorUser(actor);
    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled on this account');
    }

    const secret = generateTotpSecret();
    await this.users.setPendingMfaSecret(actor.tenantId, actor.sub, encryptMfaSecret(secret, this.encryptionKey));

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'mfa.setup_initiated',
      resourceType: 'User',
      resourceId: actor.sub,
    });

    return { secret, otpauthUri: buildTotpUri(secret, user.email) };
  }

  /**
   * Proves the user actually scanned the secret from setup() correctly
   * before MFA is enforced on their account - only then is mfaEnabled
   * flipped and backup codes issued.
   */
  async confirm(actor: RequestUser, code: string): Promise<{ backupCodes: string[] }> {
    const user = await this.findActorUser(actor);
    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled on this account');
    }
    if (!user.mfaSecretEncrypted) {
      throw new BadRequestException('Call setup before confirm');
    }

    const secret = decryptMfaSecret(user.mfaSecretEncrypted, this.encryptionKey);
    if (!verifyTotpCode(secret, code)) {
      throw new UnauthorizedException('Invalid code');
    }

    const plainCodes = generateBackupCodes();
    await this.backupCodes.createMany(actor.tenantId, actor.sub, plainCodes.map(hashBackupCode));
    await this.users.enableMfa(actor.tenantId, actor.sub);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'mfa.enabled',
      resourceType: 'User',
      resourceId: actor.sub,
    });

    return { backupCodes: plainCodes };
  }

  async disable(actor: RequestUser, password: string): Promise<void> {
    const user = await this.findActorUser(actor);
    if (!user.mfaEnabled) {
      throw new BadRequestException('MFA is not enabled on this account');
    }

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.users.clearMfa(actor.tenantId, actor.sub);
    await this.backupCodes.deleteAllForUser(actor.tenantId, actor.sub);

    // Force re-login everywhere: a hijacked session shouldn't be able to
    // quietly turn MFA off and keep using the account. Revokes both
    // stateful refresh tokens and already-issued access tokens (via
    // TokenRevocationService) - the same defense-in-depth pair
    // UserAccessRepository uses for portal-access deactivation.
    await this.refreshTokens.revokeAllForUser(actor.tenantId, actor.sub);
    await this.revocation.revokeAllForUser(actor.sub);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'mfa.disabled',
      resourceType: 'User',
      resourceId: actor.sub,
    });
  }

  /**
   * Verifies a login-time MFA code - TOTP first, falling back to an unused
   * backup code - for an already-resolved user. Used by AuthService during
   * the login flow, which needs this same encrypt/verify machinery without
   * duplicating MFA_ENCRYPTION_KEY handling in a second place. Marks a
   * matched backup code as used so it can't be replayed.
   */
  async verifyLoginCode(
    tenantId: string | null,
    userId: string,
    encryptedSecret: string,
    code: string,
  ): Promise<boolean> {
    const secret = decryptMfaSecret(encryptedSecret, this.encryptionKey);
    if (verifyTotpCode(secret, code)) {
      return true;
    }

    const match = await this.backupCodes.findUnused(tenantId, userId, hashBackupCode(code));
    if (!match) {
      return false;
    }
    await this.backupCodes.markUsed(tenantId, match.id);
    return true;
  }

  private async findActorUser(actor: RequestUser) {
    const user = await this.users.findById(actor.tenantId, actor.sub);
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    return user;
  }
}
