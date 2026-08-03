import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Employee, EmployeePaymentMethod, PaymentMethodType } from '@prisma/client';
import { AppConfigService, decryptAesGcm, deriveEncryptionKey, encryptAesGcm } from '@africahr/platform-core';
import { AuditService } from '@africahr/platform-audit';
import { resolvePaystackBankListParams } from '@africahr/employee-domain';
import { EmployeeRepository, PaymentMethodRepository } from '@africahr/employee-data-access';
import { UpsertPaymentMethodDto } from './dto/upsert-payment-method.dto';
import { BankOption, PaystackBankClient } from './paystack-bank-client';

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
    private readonly bankClient: PaystackBankClient,
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
    const employee = await this.resolveOwnEmployee(tenantId, userId);
    return employee.id;
  }

  private async resolveOwnEmployee(tenantId: string, userId: string): Promise<Employee> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee;
  }

  /**
   * Bank/mobile-money-provider options for the caller's own country, to
   * populate the payment-method form's picker - the country is the
   * employee's own (Employee.countryCode), not something the caller
   * chooses, since payroll only ever disburses in the employee's actual
   * country. Returns an empty list (not an error) for a country/type
   * combination Paystack Transfers doesn't support (see
   * resolvePaystackBankListParams), so the form can show "no options
   * available" rather than a hard failure.
   */
  async listBanksForSelf(
    tenantId: string,
    userId: string,
    paymentMethodType: PaymentMethodType,
  ): Promise<BankOption[]> {
    if (!Object.values(PaymentMethodType).includes(paymentMethodType)) {
      throw new BadRequestException(`Invalid payment method type "${paymentMethodType}"`);
    }

    const employee = await this.resolveOwnEmployee(tenantId, userId);
    const params = resolvePaystackBankListParams(employee.countryCode, paymentMethodType);
    if (!params) {
      return [];
    }
    return this.bankClient.listBanks(params);
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
