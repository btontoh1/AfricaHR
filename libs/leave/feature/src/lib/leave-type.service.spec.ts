import { ConflictException, NotFoundException } from '@nestjs/common';
import { LeaveType, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { LeaveTypeRepository } from '@africahr/leave-data-access';
import { LeaveTypeService } from './leave-type.service';

describe('LeaveTypeService', () => {
  let service: LeaveTypeService;
  let leaveTypes: jest.Mocked<LeaveTypeRepository>;
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

  beforeEach(() => {
    leaveTypes = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<LeaveTypeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new LeaveTypeService(leaveTypes, audit);
  });

  describe('create', () => {
    it('translates a duplicate code into ConflictException', async () => {
      leaveTypes.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique violation', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', { name: 'Annual', code: 'ANNUAL', defaultEntitlementDays: 15 }),
      ).rejects.toThrow(ConflictException);
    });

    it('records an audit entry on success', async () => {
      const created = makeLeaveType();
      leaveTypes.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { name: 'Annual Leave', code: 'ANNUAL', defaultEntitlementDays: 15 },
        'hr-1',
      );

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'leave.type.created', resourceId: created.id }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the leave type does not exist', async () => {
      leaveTypes.findById.mockResolvedValue(null);

      await expect(service.update('tenant-1', 'missing', {})).rejects.toThrow(NotFoundException);
      expect(leaveTypes.update).not.toHaveBeenCalled();
    });

    it('updates and audits on success', async () => {
      leaveTypes.findById.mockResolvedValue(makeLeaveType());
      leaveTypes.update.mockResolvedValue(makeLeaveType({ isActive: false }));

      await service.update('tenant-1', 'lt-1', { isActive: false }, 'hr-1');

      expect(leaveTypes.update).toHaveBeenCalledWith(
        'tenant-1',
        'lt-1',
        expect.objectContaining({ isActive: false, updatedBy: 'hr-1' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'leave.type.updated' }),
      );
    });
  });
});
