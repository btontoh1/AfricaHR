import { ForbiddenException, Injectable } from '@nestjs/common';
import { EmployeePaymentMethod } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { EmployeeRepository, PaymentMethodRepository } from '@africahr/employee-data-access';
import { UpsertPaymentMethodDto } from './dto/upsert-payment-method.dto';

@Injectable()
export class PaymentMethodService {
  constructor(
    private readonly paymentMethods: PaymentMethodRepository,
    private readonly employees: EmployeeRepository,
    private readonly audit: AuditService,
  ) {}

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async getForSelf(tenantId: string, userId: string): Promise<EmployeePaymentMethod | null> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.paymentMethods.findByEmployeeId(tenantId, employeeId);
  }

  async upsertForSelf(
    tenantId: string,
    userId: string,
    dto: UpsertPaymentMethodDto,
  ): Promise<EmployeePaymentMethod> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);

    const result = await this.paymentMethods.upsert(tenantId, employeeId, {
      type: dto.type,
      bankName: dto.bankName ?? null,
      accountNumber: dto.accountNumber ?? null,
      accountName: dto.accountName ?? null,
      mobileMoneyProvider: dto.mobileMoneyProvider ?? null,
      mobileMoneyNumber: dto.mobileMoneyNumber ?? null,
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

    return result;
  }
}
