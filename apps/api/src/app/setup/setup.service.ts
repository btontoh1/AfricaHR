import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { SystemRole } from '@prisma/client';
import { AuthResponseDto, AuthService } from '@africahr/iam-feature';
import { UserRepository } from '@africahr/iam-data-access';
import { getPasswordRequirementErrors } from '@africahr/iam-domain';
import { TenantService } from '@africahr/tenancy-feature';
import { SetupDto } from './dto/setup.dto';

export interface SetupRequestContext {
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Public, unauthenticated bootstrap for a brand-new deployment — but only
 * ever while zero tenants exist. The instant the first tenant is created
 * (by this endpoint or otherwise), needsSetup() permanently returns false
 * and bootstrap() 409s forever after. Every tenant after the first still
 * goes through the existing PLATFORM_ADMIN-gated TenantController — this
 * is a one-time convenience for the very first company, not ongoing
 * self-serve signup (see project memory on ops-provisioned tenancy).
 */
@Injectable()
export class SetupService {
  constructor(
    private readonly tenants: TenantService,
    private readonly users: UserRepository,
    private readonly auth: AuthService,
  ) {}

  async needsSetup(): Promise<boolean> {
    const existing = await this.tenants.list({ take: 1 });
    return existing.length === 0;
  }

  async bootstrap(dto: SetupDto, context: SetupRequestContext = {}): Promise<AuthResponseDto> {
    if (!(await this.needsSetup())) {
      throw new ConflictException('Setup has already been completed');
    }

    const passwordErrors = getPasswordRequirementErrors(dto.adminPassword);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors);
    }

    const tenant = await this.tenants.create({
      name: dto.companyName,
      country: dto.country,
      currency: dto.currency,
      timezone: dto.timezone,
    });

    try {
      const passwordHash = await argon2.hash(dto.adminPassword);
      await this.users.create({
        tenantId: tenant.id,
        email: dto.adminEmail,
        passwordHash,
        firstName: dto.adminFirstName,
        lastName: dto.adminLastName,
        role: SystemRole.TENANT_ADMIN,
      });
    } catch (error) {
      // No admin account means an unusable tenant — don't leave it behind
      // for a public, unauthenticated endpoint to have created.
      await this.tenants.softDelete(tenant.id);
      throw error;
    }

    const result = await this.auth.login({ email: dto.adminEmail, password: dto.adminPassword }, context);
    if ('mfaRequired' in result) {
      // Unreachable: the admin user was just created above with MFA disabled
      // by default, so login() can't hit its MFA-challenge branch here.
      throw new Error('Unexpected MFA challenge during setup bootstrap');
    }
    return result;
  }
}
