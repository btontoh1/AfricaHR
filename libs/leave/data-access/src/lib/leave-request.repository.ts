import { Injectable } from '@nestjs/common';
import { LeaveRequest, LeaveRequestStatus } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateLeaveRequestInput {
  employeeId: string;
  leaveTypeId: string;
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  reason?: string;
  createdBy?: string;
}

export interface ListLeaveRequestsParams {
  employeeId?: string;
  status?: LeaveRequestStatus;
}

export interface UpdateLeaveRequestStatusInput {
  status: LeaveRequestStatus;
  approverUserId?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  updatedBy?: string;
}

export interface UpdateLeaveRequestDatesInput {
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  reason?: string;
  updatedBy?: string;
}

@Injectable()
export class LeaveRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, input: CreateLeaveRequestInput): Promise<LeaveRequest> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveRequest.create({
        data: {
          tenantId,
          employeeId: input.employeeId,
          leaveTypeId: input.leaveTypeId,
          startDate: input.startDate,
          endDate: input.endDate,
          daysRequested: input.daysRequested,
          reason: input.reason,
          createdBy: input.createdBy,
          updatedBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<LeaveRequest | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveRequest.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  list(tenantId: string, params: ListLeaveRequestsParams = {}): Promise<LeaveRequest[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveRequest.findMany({
        where: { tenantId, deletedAt: null, employeeId: params.employeeId, status: params.status },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  updateStatus(
    tenantId: string,
    id: string,
    input: UpdateLeaveRequestStatusInput,
  ): Promise<LeaveRequest> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveRequest.update({
        where: { id },
        data: {
          status: input.status,
          approverUserId: input.approverUserId,
          approvedAt: input.approvedAt,
          rejectionReason: input.rejectionReason,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }

  /** Dates/day-count correction only - status is untouched (see LeaveRequestService.update's doc comment). */
  updateDates(
    tenantId: string,
    id: string,
    input: UpdateLeaveRequestDatesInput,
  ): Promise<LeaveRequest> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.leaveRequest.update({
        where: { id },
        data: {
          startDate: input.startDate,
          endDate: input.endDate,
          daysRequested: input.daysRequested,
          reason: input.reason,
          updatedBy: input.updatedBy,
        },
      }),
    );
  }
}
