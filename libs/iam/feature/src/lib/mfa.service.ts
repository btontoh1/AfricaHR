import { BadRequestException, ConflictException, Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { MfaMethod } from '@prisma/client';
import { RequestUser, TokenRevocationService } from '@africahr/platform-auth';
import { AppConfigService } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import { RedisService } from '@africahr/platform-redis';
import {
  MfaBackupCodeRepository,
  MfaTrustedDeviceRepository,
  RefreshTokenRepository,
  UserRepository,
} from '@africahr/iam-data-access';
import {
  buildTotpUri,
  decryptMfaSecret,
  deriveMfaEncryptionKey,
  encryptMfaSecret,
  generateBackupCodes,
  generateDeviceToken,
  generateSmsOtp,
  generateTotpSecret,
  hashBackupCode,
  hashDeviceToken,
  hashSmsOtp,
  isValidPhoneNumber,
  verifyTotpCode,
} from '@africahr/iam-domain';
import { SmsDispatcher } from './sms-dispatcher';

const TRUSTED_DEVICE_TTL_DAYS = 30;
// Matches JwtTokenService's MFA_CHALLENGE_TOKEN_TTL - a login SMS code
// shouldn't outlive the challenge token it's tied to. Also used for the
// setup-time verification code, where the same 5-minute window is a
// reasonable "type it in before it expires" allowance.
const SMS_OTP_TTL_SECONDS = 5 * 60;

@Injectable()
export class MfaService {
  private readonly logger = new Logger(MfaService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly users: UserRepository,
    private readonly backupCodes: MfaBackupCodeRepository,
    private readonly trustedDevices: MfaTrustedDeviceRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly revocation: TokenRevocationService,
    private readonly audit: AuditService,
    private readonly redis: RedisService,
    private readonly sms: SmsDispatcher,
    config: AppConfigService,
  ) {
    // Derived once at construction (Nest instantiates providers eagerly),
    // so a missing/malformed MFA_ENCRYPTION_KEY fails the app's boot with a
    // clear error rather than surfacing as a confusing 500 on first use.
    this.encryptionKey = deriveMfaEncryptionKey(config.mfaEncryptionKey);
  }

  async getStatus(actor: RequestUser): Promise<{ enabled: boolean; method?: MfaMethod }> {
    const user = await this.findActorUser(actor);
    return { enabled: user.mfaEnabled, ...(user.mfaMethod ? { method: user.mfaMethod } : {}) };
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

  /**
   * Phone-based counterpart to setup() - stores the phone number as pending
   * (unverified) and texts a one-time code to it. Deliberately independent
   * of Employee.phone: this needs its own proof-of-possession before it can
   * be trusted as an authentication factor.
   */
  async setupSms(actor: RequestUser, phoneNumber: string): Promise<void> {
    const user = await this.findActorUser(actor);
    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled on this account');
    }
    if (!isValidPhoneNumber(phoneNumber)) {
      throw new BadRequestException('phoneNumber must be in E.164 format, e.g. +233201234567');
    }

    await this.users.setPendingPhoneNumber(actor.tenantId, actor.sub, phoneNumber);
    await this.sendOtp(this.smsSetupOtpKey(actor.sub), phoneNumber);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'mfa.setup_initiated',
      resourceType: 'User',
      resourceId: actor.sub,
      metadata: { method: 'sms' },
    });
  }

  /**
   * Proves the user actually received the code texted by setupSms() before
   * MFA is enforced on their account - same "prove it before enforcing it"
   * shape as confirm(), and issues the same backup-code safety net.
   */
  async confirmSms(actor: RequestUser, code: string): Promise<{ backupCodes: string[] }> {
    const user = await this.findActorUser(actor);
    if (user.mfaEnabled) {
      throw new ConflictException('MFA is already enabled on this account');
    }
    if (!user.phoneNumber) {
      throw new BadRequestException('Call setup-sms before confirm-sms');
    }

    const valid = await this.consumeOtp(this.smsSetupOtpKey(actor.sub), code);
    if (!valid) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    const plainCodes = generateBackupCodes();
    await this.backupCodes.createMany(actor.tenantId, actor.sub, plainCodes.map(hashBackupCode));
    await this.users.enablePhoneMfa(actor.tenantId, actor.sub);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'mfa.enabled',
      resourceType: 'User',
      resourceId: actor.sub,
      metadata: { method: 'sms' },
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
    await this.trustedDevices.deleteAllForUser(actor.tenantId, actor.sub);

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
   * Forgets every device previously marked "remember this device" for the
   * actor - a pure hardening action (it only ever makes future logins
   * *more* likely to re-challenge, never less), so unlike disable() it
   * doesn't require a password confirmation or touch mfaEnabled/backup
   * codes/sessions at all.
   */
  async forgetAllDevices(actor: RequestUser): Promise<void> {
    await this.trustedDevices.deleteAllForUser(actor.tenantId, actor.sub);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorUserId: actor.sub,
      action: 'mfa.trusted_devices_forgotten',
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

  /**
   * Texts a fresh login code and stores its hash - called by
   * AuthService.authenticate() the moment it decides to challenge an
   * SMS-method account (unlike TOTP, there's no shared secret to verify
   * against; a code has to actually be generated and sent). Also used to
   * resend a code from the same login attempt. SMS delivery failures are
   * logged, not thrown - the code is still stored and may still arrive, and
   * the user always has backup codes as a fallback.
   */
  async sendLoginSmsCode(userId: string, phoneNumber: string): Promise<void> {
    await this.sendOtp(this.smsLoginOtpKey(userId), phoneNumber);
  }

  /**
   * SMS counterpart to verifyLoginCode() - checks the code texted by
   * sendLoginSmsCode() first, falling back to an unused backup code, same
   * shape as the TOTP path. Consuming (deleting) the stored OTP hash on a
   * match prevents replaying the same texted code twice.
   */
  async verifySmsLoginCode(tenantId: string | null, userId: string, code: string): Promise<boolean> {
    if (await this.consumeOtp(this.smsLoginOtpKey(userId), code)) {
      return true;
    }

    const match = await this.backupCodes.findUnused(tenantId, userId, hashBackupCode(code));
    if (!match) {
      return false;
    }
    await this.backupCodes.markUsed(tenantId, match.id);
    return true;
  }

  /**
   * Issues a new device-trust token after a completed MFA verification -
   * the raw token is returned once here for the caller (AuthService) to
   * hand back to the client; only its hash is ever stored, same convention
   * as refresh tokens and backup codes.
   */
  async rememberDevice(tenantId: string | null, userId: string): Promise<string> {
    const token = generateDeviceToken();
    const expiresAt = new Date(Date.now() + TRUSTED_DEVICE_TTL_DAYS * 24 * 60 * 60 * 1000);
    await this.trustedDevices.create(tenantId, userId, hashDeviceToken(token), expiresAt);
    return token;
  }

  /**
   * Checked by AuthService.authenticate() before deciding whether to issue
   * an MFA challenge - a raw device token proves nothing on its own; it
   * only ever changes whether a challenge is required for an already
   * password-verified user, never grants access by itself.
   */
  async isDeviceTrusted(tenantId: string | null, userId: string, rawToken: string): Promise<boolean> {
    const match = await this.trustedDevices.findValid(tenantId, userId, hashDeviceToken(rawToken));
    return match !== null;
  }

  private async findActorUser(actor: RequestUser) {
    const user = await this.users.findById(actor.tenantId, actor.sub);
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    return user;
  }

  /**
   * Generates, stores (hashed, TTL'd), and texts a fresh OTP under the
   * given Redis key. Shared by setupSms() and sendLoginSmsCode() - the only
   * difference between the two call sites is which key namespace they use.
   */
  private async sendOtp(key: string, phoneNumber: string): Promise<void> {
    const code = generateSmsOtp();
    try {
      await this.redis.getClient().set(key, hashSmsOtp(code), 'EX', SMS_OTP_TTL_SECONDS);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Could not start SMS verification: ${(error as Error).message}`,
      );
    }

    const result = await this.sms.sendSms(phoneNumber, `Your ParotHR verification code is ${code}`);
    if (!result.success) {
      this.logger.warn(`Failed to send MFA SMS to a user: ${result.failureReason}`);
    }
  }

  /**
   * Checks a submitted code against the hash stored under the given Redis
   * key, deleting it on a match so it can't be replayed. Unlike
   * TokenRevocationService's Redis usage, this does NOT fail open on a
   * Redis error - there's no fallback verification path for an SMS code
   * (the secret isn't derivable from anything else), so a Redis outage
   * here must reject the code, not silently accept it.
   */
  private async consumeOtp(key: string, code: string): Promise<boolean> {
    let storedHash: string | null;
    try {
      storedHash = await this.redis.getClient().get(key);
    } catch (error) {
      throw new ServiceUnavailableException(`Could not verify code: ${(error as Error).message}`);
    }

    if (!storedHash || storedHash !== hashSmsOtp(code)) {
      return false;
    }

    try {
      await this.redis.getClient().del(key);
    } catch (error) {
      this.logger.warn(`Failed to delete consumed OTP key ${key}: ${(error as Error).message}`);
    }
    return true;
  }

  private smsSetupOtpKey(userId: string): string {
    return `mfa:sms-otp:setup:${userId}`;
  }

  private smsLoginOtpKey(userId: string): string {
    return `mfa:sms-otp:login:${userId}`;
  }
}
