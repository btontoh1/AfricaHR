import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Subscription } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { BillingEmployeeCountRepository, SubscriptionRepository } from '@africahr/billing-data-access';
import { calculateInvoiceAmount, isExpiringSoon } from '@africahr/billing-domain';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';

export interface SubscriptionWithUsage {
  subscription: Subscription;
  activeEmployeeCount: number;
  currentAmountDue: number;
  isExpiringSoon: boolean;
}

/**
 * Platform-admin-assigned, per-seat subscriptions (see project scoping
 * decision: no tenant self-serve checkout in v1). One subscription per
 * tenant — Subscription.tenantId is @unique, so assigning a second one is
 * a conflict, not an upsert.
 */
@Injectable()
export class SubscriptionService {
  constructor(
    private readonly subscriptions: SubscriptionRepository,
    private readonly employeeCounts: BillingEmployeeCountRepository,
    private readonly audit: AuditService,
  ) {}

  async assign(
    tenantId: string,
    dto: AssignSubscriptionDto,
    actorId?: string,
  ): Promise<Subscription> {
    const existing = await this.subscriptions.findByTenant(tenantId);
    if (existing) {
      throw new ConflictException(`Tenant "${tenantId}" already has a subscription`);
    }

    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date(currentPeriodStart);
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subscription = await this.subscriptions.create({
      tenantId,
      pricePerEmployee: dto.pricePerEmployee,
      currency: dto.currency,
      currentPeriodStart,
      currentPeriodEnd,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'billing.subscription.assigned',
      resourceType: 'Subscription',
      resourceId: subscription.id,
    });

    return subscription;
  }

  async getForTenant(tenantId: string): Promise<SubscriptionWithUsage> {
    const subscription = await this.findOrThrow(tenantId);
    const activeEmployeeCount = await this.employeeCounts.countActive(tenantId);

    return {
      subscription,
      activeEmployeeCount,
      currentAmountDue: calculateInvoiceAmount(
        subscription.pricePerEmployee.toNumber(),
        activeEmployeeCount,
      ),
      isExpiringSoon: isExpiringSoon(subscription.currentPeriodEnd, new Date()),
    };
  }

  async cancel(tenantId: string, actorId?: string): Promise<Subscription> {
    const subscription = await this.findOrThrow(tenantId);

    const cancelled = await this.subscriptions.update(tenantId, subscription.id, {
      status: 'CANCELLED',
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'billing.subscription.cancelled',
      resourceType: 'Subscription',
      resourceId: subscription.id,
    });

    return cancelled;
  }

  private async findOrThrow(tenantId: string): Promise<Subscription> {
    const subscription = await this.subscriptions.findByTenant(tenantId);
    if (!subscription) {
      throw new NotFoundException(`Tenant "${tenantId}" has no subscription`);
    }
    return subscription;
  }
}
