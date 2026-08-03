import { ForbiddenException, Injectable } from '@nestjs/common';
import { EmployeePaymentMethod } from '@prisma/client';
import { AppConfigService, decryptAesGcm, deriveEncryptionKey, encryptAesGcm } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import { EmployeeRepository, PaymentMethodRepository } from '@africahr/employee-data-access';
import { UpsertPaymentMethodDto } from './dto/upsert-payment-method.dto';

const ENCRYPTED_FIELDS = [
  'bankName',
  'bankCode',
  'accountNumber',
  'accountName',
  'mobileMoneyProvider',
  'mobileMoneyNumber',
] as const;

@Injectable()
export class PaymentMethodService {
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly paymentMethods: PaymentMethodRepository,
    private readonly employees: EmployeeRepository,
    private readonly audit: AuditService,
    config: AppConfigService,
  ) {
    // Derived once at construction (Nest instantiates providers eagerly),
    // so a missing/malformed PAYMENT_METHOD_ENCRYPTION_KEY fails the
    // app's boot with a clear error rather than surfacing as a confusing
    // 500 the first time an employee saves their payment details - same
    // posture as MfaService/MFA_ENCRYPTION_KEY.
    this.encryptionKey = deriveEncryptionKey(
      config.paymentMethodEncryptionKey,
      'PAYMENT_METHOD_ENCRYPTION_KEY',
    );
  }

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async getForSelf(tenantId: string, userId: string): Promise<EmployeePaymentMethod | null> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const paymentMethod = await this.paymentMethods.findByEmployeeId(tenantId, employeeId);
    return paymentMethod ? this.decryptFields(paymentMethod) : null;
  }

  async upsertForSelf(
    tenantId: string,
    userId: string,
    dto: UpsertPaymentMethodDto,
  ): Promise<EmployeePaymentMethod> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);

    const result = await this.paymentMethods.upsert(tenantId, employeeId, {
      type: dto.type,
      bankName: this.encryptField(dto.bankName),
      bankCode: this.encryptField(dto.bankCode),
      accountNumber: this.encryptField(dto.accountNumber),
      accountName: this.encryptField(dto.accountName),
      mobileMoneyProvider: this.encryptField(dto.mobileMoneyProvider),
      mobileMoneyNumber: this.encryptField(dto.mobileMoneyNumber),
      actorId: userId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: userId,
      action: 'employee.payment_method.updated',
      resourceType: 'EmployeePaymentMethod',
      resourceId: result.id,
      metadata: { type: dto.type },
    });

    return this.decryptFields(result);
  }

  private encryptField(value: string | null | undefined): string | null {
    return value ? encryptAesGcm(value, this.encryptionKey) : null;
  }

  private decryptFields(paymentMethod: EmployeePaymentMethod): EmployeePaymentMethod {
    const decrypted = { ...paymentMethod };
    for (const field of ENCRYPTED_FIELDS) {
      const value = paymentMethod[field];
      decrypted[field] = value ? decryptAesGcm(value, this.encryptionKey) : value;
    }
    return decrypted;
  }
}
