import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JobRequisition, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { JobRequisitionRepository, RecruitmentEmployeeRepository } from '@africahr/recruitment-data-access';
import { JobRequisitionService, RECRUITMENT_REQUISITION_CREATED_EVENT } from './job-requisition.service';

describe('JobRequisitionService', () => {
  let service: JobRequisitionService;
  let requisitions: jest.Mocked<JobRequisitionRepository>;
  let employees: jest.Mocked<RecruitmentEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  function makeRequisition(overrides: Partial<JobRequisition> = {}): JobRequisition {
    return {
      id: 'req-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      organizationUnitId: null,
      hiringManagerId: 'mgr-emp-1',
      title: 'Software Engineer',
      description: null,
      employmentType: 'FULL_TIME',
      openings: 1,
      status: 'DRAFT',
      targetHireDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as JobRequisition;
  }

  beforeEach(() => {
    requisitions = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    } as unknown as jest.Mocked<JobRequisitionRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn().mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' }),
    } as unknown as jest.Mocked<RecruitmentEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new JobRequisitionService(requisitions, employees, audit, eventEmitter);
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
    it('translates a foreign-key violation into NotFoundException', async () => {
      requisitions.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', {
          organizationId: 'missing-org',
          title: 'Engineer',
          employmentType: 'FULL_TIME',
        } as never),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the requisition and audits on success', async () => {
      const created = makeRequisition();
      requisitions.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { organizationId: 'org-1', title: 'Software Engineer', employmentType: 'FULL_TIME' } as never,
        'hr-1',
      );

      expect(requisitions.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ organizationId: 'org-1', title: 'Software Engineer' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.requisition.created', resourceId: created.id }),
      );
    });

    it('emits a notification event with the hiring manager and actor', async () => {
      const created = makeRequisition({ hiringManagerId: 'mgr-emp-1', title: 'Software Engineer' });
      requisitions.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { organizationId: 'org-1', title: 'Software Engineer', employmentType: 'FULL_TIME' } as never,
        'hr-1',
      );

      expect(employees.findById).toHaveBeenCalledWith('tenant-1', 'mgr-emp-1');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RECRUITMENT_REQUISITION_CREATED_EVENT,
        expect.objectContaining({
          tenantId: 'tenant-1',
          hiringManagerUserId: 'mgr-user-1',
          jobTitle: 'Software Engineer',
          actorUserId: 'hr-1',
        }),
      );
    });

    it('emits with a null hiringManagerUserId when the requisition has no hiring manager', async () => {
      const created = makeRequisition({ hiringManagerId: null });
      requisitions.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { organizationId: 'org-1', title: 'Software Engineer', employmentType: 'FULL_TIME' } as never,
        'hr-1',
      );

      expect(employees.findById).not.toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RECRUITMENT_REQUISITION_CREATED_EVENT,
        expect.objectContaining({ hiringManagerUserId: null }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the requisition does not exist', async () => {
      requisitions.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listForHiringManager', () => {
    it('resolves the caller employee id and filters by hiringManagerId', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });

      await service.listForHiringManager('tenant-1', 'mgr-user-1');

      expect(requisitions.list).toHaveBeenCalledWith('tenant-1', { hiringManagerId: 'mgr-emp-1' });
    });
  });

  describe('findByIdForHiringManager', () => {
    it('rejects a caller who is not the hiring manager', async () => {
      requisitions.findById.mockResolvedValue(makeRequisition({ hiringManagerId: 'someone-else' }));
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });

      await expect(
        service.findByIdForHiringManager('tenant-1', 'mgr-user-1', 'req-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows the hiring manager to view the requisition', async () => {
      const requisition = makeRequisition({ hiringManagerId: 'mgr-emp-1' });
      requisitions.findById.mockResolvedValue(requisition);
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });

      await expect(
        service.findByIdForHiringManager('tenant-1', 'mgr-user-1', 'req-1'),
      ).resolves.toEqual(requisition);
    });
  });

  describe('update', () => {
    it('rejects an illegal status transition', async () => {
      requisitions.findById.mockResolvedValue(makeRequisition({ status: 'CLOSED' }));

      await expect(
        service.update('tenant-1', 'req-1', { status: 'DRAFT' } as never),
      ).rejects.toThrow(ConflictException);
      expect(requisitions.update).not.toHaveBeenCalled();
    });

    it('allows a legal status transition', async () => {
      requisitions.findById.mockResolvedValue(makeRequisition({ status: 'DRAFT' }));
      requisitions.update.mockResolvedValue(makeRequisition({ status: 'OPEN' }));

      await service.update('tenant-1', 'req-1', { status: 'OPEN' } as never);

      expect(requisitions.update).toHaveBeenCalledWith(
        'tenant-1',
        'req-1',
        expect.objectContaining({ status: 'OPEN' }),
      );
    });

    it('does not run the transition guard when status is omitted from the update', async () => {
      requisitions.findById.mockResolvedValue(makeRequisition({ status: 'CLOSED' }));
      requisitions.update.mockResolvedValue(makeRequisition({ status: 'CLOSED', title: 'New title' }));

      await service.update('tenant-1', 'req-1', { title: 'New title' });

      expect(requisitions.update).toHaveBeenCalledWith(
        'tenant-1',
        'req-1',
        expect.objectContaining({ title: 'New title' }),
      );
    });

    it('does not run the transition guard when the status is unchanged', async () => {
      requisitions.findById.mockResolvedValue(makeRequisition({ status: 'OPEN' }));
      requisitions.update.mockResolvedValue(makeRequisition({ status: 'OPEN', title: 'New title' }));

      await expect(
        service.update('tenant-1', 'req-1', { status: 'OPEN', title: 'New title' } as never),
      ).resolves.toBeDefined();
      expect(requisitions.update).toHaveBeenCalled();
    });
  });

  describe('updateForHiringManager', () => {
    it('rejects a caller who is not the hiring manager', async () => {
      requisitions.findById.mockResolvedValue(makeRequisition({ hiringManagerId: 'someone-else' }));
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });

      await expect(
        service.updateForHiringManager('tenant-1', 'mgr-user-1', 'req-1', { title: 'New title' }),
      ).rejects.toThrow(ForbiddenException);
      expect(requisitions.update).not.toHaveBeenCalled();
    });

    it('allows the hiring manager to update the requisition', async () => {
      const requisition = makeRequisition({ hiringManagerId: 'mgr-emp-1' });
      requisitions.findById.mockResolvedValue(requisition);
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });
      requisitions.update.mockResolvedValue(makeRequisition({ title: 'New title' }));

      await service.updateForHiringManager('tenant-1', 'mgr-user-1', 'req-1', { title: 'New title' });

      expect(requisitions.update).toHaveBeenCalledWith(
        'tenant-1',
        'req-1',
        expect.objectContaining({ title: 'New title' }),
      );
    });
  });
});
