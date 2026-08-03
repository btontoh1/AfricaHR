import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Candidate, JobRequisition, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  ApplicationRepository,
  ApplicationWithRelations,
  JobRequisitionRepository,
  RecruitmentEmployeeRepository,
} from '@africahr/recruitment-data-access';
import { ApplicationService, RECRUITMENT_APPLICATION_CREATED_EVENT } from './application.service';

describe('ApplicationService', () => {
  let service: ApplicationService;
  let applications: jest.Mocked<ApplicationRepository>;
  let requisitions: jest.Mocked<JobRequisitionRepository>;
  let employees: jest.Mocked<RecruitmentEmployeeRepository>;
  let audit: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
    return {
      id: 'cand-1',
      tenantId: 'tenant-1',
      firstName: 'Ama',
      lastName: 'Boateng',
      email: 'ama@example.com',
      phone: null,
      source: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as Candidate;
  }

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
      status: 'OPEN',
      targetHireDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as JobRequisition;
  }

  function makeApplication(overrides: Partial<ApplicationWithRelations> = {}): ApplicationWithRelations {
    return {
      id: 'app-1',
      tenantId: 'tenant-1',
      candidateId: 'cand-1',
      requisitionId: 'req-1',
      stage: 'APPLIED',
      appliedAt: new Date(),
      notes: null,
      rejectionReason: null,
      offeredSalary: null,
      offeredStartDate: null,
      offerSentAt: null,
      offerRespondedAt: null,
      offerAccepted: null,
      hiredEmployeeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      createdBy: null,
      updatedBy: null,
      candidate: makeCandidate(),
      requisition: makeRequisition(),
      ...overrides,
    } as ApplicationWithRelations;
  }

  beforeEach(() => {
    applications = {
      create: jest.fn(),
      findById: jest.fn(),
      findByCandidateAndRequisition: jest.fn().mockResolvedValue(null),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    } as unknown as jest.Mocked<ApplicationRepository>;

    requisitions = {
      findById: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<JobRequisitionRepository>;

    employees = {
      findByUserId: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<RecruitmentEmployeeRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;

    service = new ApplicationService(applications, requisitions, employees, audit, eventEmitter);
  });

  describe('create', () => {
    it('rejects a duplicate application for the same candidate and requisition', async () => {
      applications.findByCandidateAndRequisition.mockResolvedValue(makeApplication());

      await expect(
        service.create('tenant-1', { candidateId: 'cand-1', requisitionId: 'req-1' }),
      ).rejects.toThrow(ConflictException);
      expect(applications.create).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation into NotFoundException', async () => {
      applications.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.create('tenant-1', { candidateId: 'missing', requisitionId: 'req-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates the application and audits on success', async () => {
      const created = makeApplication();
      applications.create.mockResolvedValue(created);

      await service.create('tenant-1', { candidateId: 'cand-1', requisitionId: 'req-1' }, 'hr-1');

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.application.created', resourceId: created.id }),
      );
    });

    it('emits a notification event when the requisition has a hiring manager with portal access', async () => {
      const created = makeApplication({ candidateId: 'cand-1', requisitionId: 'req-1' });
      applications.create.mockResolvedValue(created);
      applications.findById.mockResolvedValue(
        makeApplication({
          id: created.id,
          candidate: makeCandidate({ firstName: 'Kwame', lastName: 'Asante' }),
          requisition: makeRequisition({ hiringManagerId: 'mgr-emp-1', title: 'Software Engineer' }),
        }),
      );
      employees.findById.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });

      await service.create('tenant-1', { candidateId: 'cand-1', requisitionId: 'req-1' }, 'hr-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RECRUITMENT_APPLICATION_CREATED_EVENT,
        expect.objectContaining({
          tenantId: 'tenant-1',
          hiringManagerUserId: 'mgr-user-1',
          candidateName: 'Kwame Asante',
          jobTitle: 'Software Engineer',
          actorUserId: 'hr-1',
        }),
      );
    });

    it('emits with a null hiringManagerUserId when the requisition has no hiring manager', async () => {
      const created = makeApplication();
      applications.create.mockResolvedValue(created);
      applications.findById.mockResolvedValue(
        makeApplication({ id: created.id, requisition: makeRequisition({ hiringManagerId: null }) }),
      );

      await service.create('tenant-1', { candidateId: 'cand-1', requisitionId: 'req-1' }, 'hr-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RECRUITMENT_APPLICATION_CREATED_EVENT,
        expect.objectContaining({ tenantId: 'tenant-1', hiringManagerUserId: null }),
      );
    });

    it('emits with a null hiringManagerUserId when the hiring manager has no portal access', async () => {
      const created = makeApplication();
      applications.create.mockResolvedValue(created);
      applications.findById.mockResolvedValue(
        makeApplication({ id: created.id, requisition: makeRequisition({ hiringManagerId: 'mgr-emp-1' }) }),
      );
      employees.findById.mockResolvedValue({ id: 'mgr-emp-1', userId: null });

      await service.create('tenant-1', { candidateId: 'cand-1', requisitionId: 'req-1' }, 'hr-1');

      expect(eventEmitter.emit).toHaveBeenCalledWith(
        RECRUITMENT_APPLICATION_CREATED_EVENT,
        expect.objectContaining({ tenantId: 'tenant-1', hiringManagerUserId: null }),
      );
    });
  });

  describe('advance', () => {
    it('rejects an illegal stage transition', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'APPLIED' }));

      await expect(
        service.advance('tenant-1', 'app-1', { stage: 'HIRED' } as never),
      ).rejects.toThrow(ConflictException);
      expect(applications.update).not.toHaveBeenCalled();
    });

    it('requires a rejectionReason when rejecting', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'APPLIED' }));

      await expect(
        service.advance('tenant-1', 'app-1', { stage: 'REJECTED' } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('advances the stage and audits on success', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'APPLIED' }));
      applications.update.mockResolvedValue(makeApplication({ stage: 'SCREENING' }));

      await service.advance('tenant-1', 'app-1', { stage: 'SCREENING' } as never, 'hr-1');

      expect(applications.update).toHaveBeenCalledWith(
        'tenant-1',
        'app-1',
        expect.objectContaining({ stage: 'SCREENING' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'recruitment.application.stage_changed',
          metadata: { from: 'APPLIED', to: 'SCREENING' },
        }),
      );
    });
  });

  describe('advanceAsHiringManager', () => {
    it('rejects a caller who is not the hiring manager of the requisition', async () => {
      applications.findById.mockResolvedValue(makeApplication());
      requisitions.findById.mockResolvedValue(makeRequisition({ hiringManagerId: 'someone-else' }));
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });

      await expect(
        service.advanceAsHiringManager('tenant-1', 'mgr-user-1', 'app-1', { stage: 'SCREENING' } as never),
      ).rejects.toThrow(ForbiddenException);
      expect(applications.update).not.toHaveBeenCalled();
    });

    it('allows the hiring manager to advance the stage', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'APPLIED' }));
      requisitions.findById.mockResolvedValue(makeRequisition({ hiringManagerId: 'mgr-emp-1' }));
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });
      applications.update.mockResolvedValue(makeApplication({ stage: 'SCREENING' }));

      await service.advanceAsHiringManager('tenant-1', 'mgr-user-1', 'app-1', { stage: 'SCREENING' } as never);

      expect(applications.update).toHaveBeenCalledWith(
        'tenant-1',
        'app-1',
        expect.objectContaining({ stage: 'SCREENING' }),
      );
    });
  });

  describe('sendOffer', () => {
    it('rejects sending an offer outside the OFFER stage', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'INTERVIEW' }));

      await expect(
        service.sendOffer('tenant-1', 'app-1', { offeredSalary: 3500, offeredStartDate: '2026-08-01' }),
      ).rejects.toThrow(ConflictException);
      expect(applications.update).not.toHaveBeenCalled();
    });

    it('records offer details and audits on success', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'OFFER' }));
      applications.update.mockResolvedValue(makeApplication({ stage: 'OFFER' }));

      await service.sendOffer(
        'tenant-1',
        'app-1',
        { offeredSalary: 3500, offeredStartDate: '2026-08-01' },
        'hr-1',
      );

      expect(applications.update).toHaveBeenCalledWith(
        'tenant-1',
        'app-1',
        expect.objectContaining({ offeredSalary: 3500 }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.application.offer_sent' }),
      );
    });
  });

  describe('respondToOffer', () => {
    it('rejects responding when there is no pending offer', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'OFFER', offerSentAt: null }));

      await expect(
        service.respondToOffer('tenant-1', 'app-1', { accepted: true }),
      ).rejects.toThrow(ConflictException);
    });

    it('moves the application to HIRED when accepted', async () => {
      applications.findById.mockResolvedValue(
        makeApplication({ stage: 'OFFER', offerSentAt: new Date() }),
      );
      applications.update.mockResolvedValue(makeApplication({ stage: 'HIRED' }));

      await service.respondToOffer('tenant-1', 'app-1', { accepted: true }, 'hr-1');

      expect(applications.update).toHaveBeenCalledWith(
        'tenant-1',
        'app-1',
        expect.objectContaining({ stage: 'HIRED', offerAccepted: true }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.application.offer_accepted' }),
      );
    });

    it('moves the application to REJECTED when declined', async () => {
      applications.findById.mockResolvedValue(
        makeApplication({ stage: 'OFFER', offerSentAt: new Date() }),
      );
      applications.update.mockResolvedValue(makeApplication({ stage: 'REJECTED' }));

      await service.respondToOffer('tenant-1', 'app-1', { accepted: false }, 'hr-1');

      expect(applications.update).toHaveBeenCalledWith(
        'tenant-1',
        'app-1',
        expect.objectContaining({ stage: 'REJECTED', offerAccepted: false }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.application.offer_declined' }),
      );
    });
  });

  describe('linkHiredEmployee', () => {
    it('rejects linking before the application has reached HIRED', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'OFFER' }));

      await expect(
        service.linkHiredEmployee('tenant-1', 'app-1', { employeeId: 'emp-9' }),
      ).rejects.toThrow(ConflictException);
      expect(applications.update).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation into NotFoundException', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'HIRED' }));
      applications.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('FK violation', {
          code: 'P2003',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        service.linkHiredEmployee('tenant-1', 'app-1', { employeeId: 'missing-emp' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('links the hired employee and audits on success', async () => {
      applications.findById.mockResolvedValue(makeApplication({ stage: 'HIRED' }));
      applications.update.mockResolvedValue(
        makeApplication({ stage: 'HIRED', hiredEmployeeId: 'emp-9' }),
      );

      await service.linkHiredEmployee('tenant-1', 'app-1', { employeeId: 'emp-9' }, 'hr-1');

      expect(applications.update).toHaveBeenCalledWith(
        'tenant-1',
        'app-1',
        expect.objectContaining({ hiredEmployeeId: 'emp-9' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.application.hired_employee_linked' }),
      );
    });
  });

  describe('listForHiringManager', () => {
    it('returns an empty list when the caller has no requisitions', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });
      requisitions.list.mockResolvedValue([]);

      const result = await service.listForHiringManager('tenant-1', 'mgr-user-1');

      expect(result).toEqual([]);
      expect(applications.list).not.toHaveBeenCalled();
    });

    it('aggregates applications across all of the caller’s requisitions', async () => {
      employees.findByUserId.mockResolvedValue({ id: 'mgr-emp-1', userId: 'mgr-user-1' });
      requisitions.list.mockResolvedValue([
        makeRequisition({ id: 'req-1' }),
        makeRequisition({ id: 'req-2' }),
      ]);
      applications.list
        .mockResolvedValueOnce([makeApplication({ id: 'app-1', requisitionId: 'req-1' })])
        .mockResolvedValueOnce([makeApplication({ id: 'app-2', requisitionId: 'req-2' })]);

      const result = await service.listForHiringManager('tenant-1', 'mgr-user-1');

      expect(result).toHaveLength(2);
      expect(applications.list).toHaveBeenCalledWith('tenant-1', { requisitionId: 'req-1' });
      expect(applications.list).toHaveBeenCalledWith('tenant-1', { requisitionId: 'req-2' });
    });
  });
});
