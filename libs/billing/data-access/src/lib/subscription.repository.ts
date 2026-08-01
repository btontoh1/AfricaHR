import { Injectable } from '@nestjs/common';
import { Subscription, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateSubscriptionInput {
  tenantId: string;
  pricePerEmployee: number;
  currency: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  createdBy?: string;
}

export interface UpdateSubscriptionInput {
  pricePerEmployee?: number;
  currency?: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  paystackCustomerCode?: string;
  updatedBy?: string;
}

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(input: CreateSubscriptionInput): Promise<Subscription> {
    return this.prisma.withTenantContext(input.tenantId, (tx) =>
      tx.subscription.create({
        data: {
          tenantId: input.tenantId,
          pricePerEmployee: input.pricePerEmployee,
          currency: input.currency,
          currentPeriodStart: input.currentPeriodStart,
          currentPeriodEnd: input.currentPeriodEnd,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findByTenant(tenantId: string): Promise<Subscription | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.subscription.findUnique({ where: { tenantId } }),
    );
  }

  update(tenantId: string, id: string, input: UpdateSubscriptionInput): Promise<Subscription> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.subscription.update({
        where: { id },
        data: input,
      }),
    );
  }
}
