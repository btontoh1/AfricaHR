import { NotFoundException } from '@nestjs/common';
import { Candidate, JobRequisition } from '@prisma/client';
import { CandidateRepository, JobRequisitionRepository } from '@africahr/recruitment-data-access';
import { ApplicationService } from './application.service';
import { PublicApplicationService } from './public-application.service';

describe('PublicApplicationService', () => {
  let service: PublicApplicationService;
  let requisitions: jest.Mocked<JobRequisitionRepository>;
  let candidates: jest.Mocked<CandidateRepository>;
  let applications: jest.Mocked<ApplicationService>;

  function makeRequisition(overrides: Partial<JobRequisition> = {}): JobRequisition {
    return {
      id: 'req-1',
      tenantId: 'tenant-1',
      organizationId: 'org-1',
      organizationUnitId: null,
      hiringManagerId: null,
      title: 'Software Engineer',
      description: 'Build things',
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

  function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
    return {
      id: 'cand-1',
      tenantId: 'tenant-1',
      firstName: 'Kwame',
      lastName: 'Mensah',
      email: 'kwame@example.com',
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

  beforeEach(() => {
    requisitions = {
      findOpenByIdAcrossTenants: jest.fn(),
    } as unknown as jest.Mocked<JobRequisitionRepository>;
    candidates = {
      list: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<CandidateRepository>;
    applications = {
      create: jest.fn(),
    } as unknown as jest.Mocked<ApplicationService>;

    service = new PublicApplicationService(requisitions, candidates, applications);
  });

  describe('getOpenRequisition', () => {
    it('returns a public-safe shape for an open requisition', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());

      const result = await service.getOpenRequisition('req-1');

      expect(result).toEqual({
        id: 'req-1',
        title: 'Software Engineer',
        description: 'Build things',
        employmentType: 'FULL_TIME',
      });
      expect(result).not.toHaveProperty('tenantId');
      expect(result).not.toHaveProperty('organizationId');
    });

    it('throws NotFoundException when the requisition is not open or does not exist', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(null);

      await expect(service.getOpenRequisition('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('apply', () => {
    it('throws NotFoundException without touching candidates/applications when the requisition is not open', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(null);

      await expect(
        service.apply('req-1', { firstName: 'Kwame', lastName: 'Mensah', email: 'kwame@example.com' }),
      ).rejects.toThrow(NotFoundException);

      expect(candidates.list).not.toHaveBeenCalled();
      expect(applications.create).not.toHaveBeenCalled();
    });

    it('creates a new candidate when no existing candidate matches the email, then creates the application', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());
      candidates.list.mockResolvedValue([]);
      candidates.create.mockResolvedValue(makeCandidate());
      applications.create.mockResolvedValue({ id: 'app-1' } as never);

      const result = await service.apply('req-1', {
        firstName: 'Kwame',
        lastName: 'Mensah',
        email: 'kwame@example.com',
        phone: '+233201234567',
      });

      expect(candidates.create).toHaveBeenCalledWith('tenant-1', {
        firstName: 'Kwame',
        lastName: 'Mensah',
        email: 'kwame@example.com',
        phone: '+233201234567',
        source: 'Company careers page',
      });
      expect(applications.create).toHaveBeenCalledWith('tenant-1', {
        candidateId: 'cand-1',
        requisitionId: 'req-1',
      });
      expect(result).toEqual({ applicationId: 'app-1' });
    });

    it('reuses an existing candidate matched by email instead of creating a duplicate', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());
      candidates.list.mockResolvedValue([makeCandidate({ id: 'cand-existing' })]);
      applications.create.mockResolvedValue({ id: 'app-2' } as never);

      await service.apply('req-1', {
        firstName: 'Kwame',
        lastName: 'Mensah',
        email: 'kwame@example.com',
      });

      expect(candidates.create).not.toHaveBeenCalled();
      expect(applications.create).toHaveBeenCalledWith('tenant-1', {
        candidateId: 'cand-existing',
        requisitionId: 'req-1',
      });
    });

    it('propagates ApplicationService.create rejecting a duplicate application (already applied)', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());
      candidates.list.mockResolvedValue([makeCandidate()]);
      const conflict = new Error('This candidate has already applied to this requisition');
      applications.create.mockRejectedValue(conflict);

      await expect(
        service.apply('req-1', { firstName: 'Kwame', lastName: 'Mensah', email: 'kwame@example.com' }),
      ).rejects.toThrow(conflict);
    });
  });
});
