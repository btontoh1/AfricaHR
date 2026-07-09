import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { LeaveBalance, LeaveRequest, LeaveType, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  LeaveBalanceRepository,
  LeaveEmployeeRepository,
  LeaveRequestRepository,
  LeaveTypeRepository,
} from '@africahr/leave-data-access';
import { LeaveRequestService } from './leave-request.service';

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;
  let requests: jest.Mocked<LeaveRequestRepository>;
  let balances: jest.Mocked<LeaveBalanceRepository>;
  let leaveTypes: jest.Mocked<LeaveTypeRepository>;
  let employees: jest.Mocked<LeaveEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;

  function makeLeaveType(overrides: Partial<LeaveType> = {}): LeaveType {
    return {
      id: 'lt-1',
      tenantId: 'tenant-1',
      name: 'Annual Leave',
      code: 'ANNUAL',
      isPaid: true,
      defaultEntitlementDays: new Prisma.Decimal(15),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as LeaveType;
  }

  function makeBalance(overrides: Partial<LeaveBalance> = {}): LeaveBalance {
    return {
      id: 'bal-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      leaveTypeId: 'lt-1',
      year: 2026,
      entitledDays: new Prisma.Decimal(15),
      usedDays: new Prisma.Decimal(0),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as LeaveBalance;
  }

  function makeRequest(overrides: Partial<LeaveRequest> = {}): LeaveRequest {
    return {
      id: 'req-1',
      tenantId: 'tenant-1',
      employeeId: 'emp-1',
      leaveTypeId: 'lt-1',
      startDate: new Date('2026-02-02'),
      endDate: new Date('2026-02-06'),
      daysRequested: new Prisma.Decimal(5),
      reason: null,
      status: 'PENDING',
      approverUserId: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as LeaveRequest;
  }

  beforeEach(() => {
    requests = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<LeaveRequestRepository>;

    balances = {
      upsertEntitlement: jest.fn(),
      findByEmployeeAndType: jest.fn().mockResolvedValue(null),
      listByEmployee: jest.fn(),
      incrementUsedDays: jest.fn(),
      decrementUsedDays: jest.fn(),
    } as unknown as jest.Mocked<LeaveBalanceRepository>;

    leaveTypes = {
      findById: jest.fn().mockResolvedValue(makeLeaveType()),
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<LeaveTypeRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<LeaveEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new LeaveRequestService(requests, balances, leaveTypes, employees, audit);
  });

  describe('resolveOwnEmployeeId', () => {
    it('throws ForbiddenException when the user has no linked employee', async () => {
      employees.findByUserId.mockResolvedValue(null);

      await expect(service.resolveOwnEmployeeId('tenant-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('rejects endDate before startDate', async () => {
      await expect(
        service.create('tenant-1', 'emp-1', {
          leaveTypeId: 'lt-1',
          startDate: '2026-02-06',
          endDate: '2026-02-02',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a range with zero working days', async () => {
      // 2026-01-03/01-04 are Sat/Sun
      await expect(
        service.create('tenant-1', 'emp-1', {
          leaveTypeId: 'lt-1',
          startDate: '2026-01-03',
          endDate: '2026-01-04',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the leave type does not exist', async () => {
      leaveTypes.findById.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', 'emp-1', {
          leaveTypeId: 'missing',
          startDate: '2026-02-02',
          endDate: '2026-02-06',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the request exceeds the default entitlement (no balance row yet)', async () => {
      leaveTypes.findById.mockResolvedValue(makeLeaveType({ defaultEntitlementDays: new Prisma.Decimal(3) }));

      await expect(
        service.create('tenant-1', 'emp-1', {
          leaveTypeId: 'lt-1',
          startDate: '2026-02-02',
          endDate: '2026-02-06',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates the request and audits on success', async () => {
      const created = makeRequest();
      requests.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        'emp-1',
        { leaveTypeId: 'lt-1', startDate: '2026-02-02', endDate: '2026-02-06', reason: 'Vacation' },
        'emp-1-user',
      );

      expect(requests.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', leaveTypeId: 'lt-1', daysRequested: 5 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'leave.request.created', resourceId: created.id }),
      );
    });
  });

  describe('cancelForSelf', () => {
    it('does not reveal a request belonging to a different employee', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'emp-1', userId: 'user-1' });
      requests.findById.mockResolvedValue(makeRequest({ employeeId: 'someone-else' }));

      await expect(service.cancelForSelf('tenant-1', 'user-1', 'req-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('cancel', () => {
    it('rejects cancelling a REJECTED request', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'REJECTED' }));

      await expect(service.cancel('tenant-1', 'req-1')).rejects.toThrow(ConflictException);
    });

    it('restores the balance when cancelling an APPROVED request', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'APPROVED' }));
      balances.findByEmployeeAndType.mockResolvedValue(makeBalance({ usedDays: new Prisma.Decimal(5) }));
      requests.updateStatus.mockResolvedValue(makeRequest({ status: 'CANCELLED' }));

      await service.cancel('tenant-1', 'req-1', 'hr-1');

      expect(balances.decrementUsedDays).toHaveBeenCalledWith('tenant-1', 'bal-1', new Prisma.Decimal(5), 'hr-1');
    });

    it('does not touch the balance when cancelling a still-PENDING request', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'PENDING' }));
      requests.updateStatus.mockResolvedValue(makeRequest({ status: 'CANCELLED' }));

      await service.cancel('tenant-1', 'req-1');

      expect(balances.decrementUsedDays).not.toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('rejects approving an already-APPROVED request', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'APPROVED' }));

      await expect(service.approve('tenant-1', 'req-1')).rejects.toThrow(ConflictException);
    });

    it('rejects approving when the balance is insufficient', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'PENDING', daysRequested: new Prisma.Decimal(20) }));
      leaveTypes.findById.mockResolvedValue(makeLeaveType({ defaultEntitlementDays: new Prisma.Decimal(15) }));

      await expect(service.approve('tenant-1', 'req-1')).rejects.toThrow(ConflictException);
      expect(requests.updateStatus).not.toHaveBeenCalled();
    });

    it('lazily materializes a balance row from the default entitlement when none exists', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'PENDING' }));
      balances.findByEmployeeAndType.mockResolvedValue(null);
      balances.upsertEntitlement.mockResolvedValue(makeBalance({ id: 'new-bal' }));
      requests.updateStatus.mockResolvedValue(makeRequest({ status: 'APPROVED' }));

      await service.approve('tenant-1', 'req-1', 'hr-1');

      expect(balances.upsertEntitlement).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ employeeId: 'emp-1', leaveTypeId: 'lt-1' }),
      );
      expect(balances.incrementUsedDays).toHaveBeenCalledWith('tenant-1', 'new-bal', 5, 'hr-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'leave.request.approved' }),
      );
    });

    it('reuses an existing balance row without re-materializing it', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'PENDING' }));
      balances.findByEmployeeAndType.mockResolvedValue(makeBalance({ id: 'existing-bal' }));
      requests.updateStatus.mockResolvedValue(makeRequest({ status: 'APPROVED' }));

      await service.approve('tenant-1', 'req-1', 'hr-1');

      expect(balances.upsertEntitlement).not.toHaveBeenCalled();
      expect(balances.incrementUsedDays).toHaveBeenCalledWith('tenant-1', 'existing-bal', 5, 'hr-1');
    });
  });

  describe('reject', () => {
    it('rejects rejecting an already-terminal request', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'CANCELLED' }));

      await expect(service.reject('tenant-1', 'req-1', 'No longer needed')).rejects.toThrow(
        ConflictException,
      );
    });

    it('persists the rejection reason and audits', async () => {
      requests.findById.mockResolvedValue(makeRequest({ status: 'PENDING' }));
      requests.updateStatus.mockResolvedValue(makeRequest({ status: 'REJECTED' }));

      await service.reject('tenant-1', 'req-1', 'Insufficient coverage', 'hr-1');

      expect(requests.updateStatus).toHaveBeenCalledWith(
        'tenant-1',
        'req-1',
        expect.objectContaining({ status: 'REJECTED', rejectionReason: 'Insufficient coverage' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'leave.request.rejected' }),
      );
    });
  });
});
