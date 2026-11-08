import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Candidate, JobRequisition } from '@prisma/client';
import { ApplicationRepository, CandidateRepository, JobRequisitionRepository } from '@africahr/recruitment-data-access';
import { StorageService } from '@africahr/platform-storage';
import { ApplicationService } from './application.service';
import { PublicApplicationService } from './public-application.service';

describe('PublicApplicationService', () => {
  let service: PublicApplicationService;
  let requisitions: jest.Mocked<JobRequisitionRepository>;
  let candidates: jest.Mocked<CandidateRepository>;
  let applications: jest.Mocked<ApplicationService>;
  let applicationRepository: jest.Mocked<ApplicationRepository>;
  let storage: jest.Mocked<StorageService>;

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
    applicationRepository = {
      update: jest.fn(),
    } as unknown as jest.Mocked<ApplicationRepository>;
    storage = {
      getUploadUrl: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    service = new PublicApplicationService(requisitions, candidates, applications, applicationRepository, storage);
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

  describe('requestResumeUpload', () => {
    it('mints an upload URL scoped under resumes/<tenantId>/ for the requisition\'s tenant', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());
      storage.getUploadUrl.mockResolvedValue('https://storage.example/signed-put');

      const result = await service.requestResumeUpload('req-1', {
        fileName: 'resume.pdf',
        contentType: 'application/pdf',
      });

      expect(storage.getUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^resumes\/tenant-1\/.+-resume\.pdf$/),
        'application/pdf',
      );
      expect(result).toEqual({
        uploadUrl: 'https://storage.example/signed-put',
        storageKey: expect.stringMatching(/^resumes\/tenant-1\/.+-resume\.pdf$/),
      });
    });

    it('throws NotFoundException when the requisition is not open', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(null);

      await expect(
        service.requestResumeUpload('req-1', { fileName: 'resume.pdf', contentType: 'application/pdf' }),
      ).rejects.toThrow(NotFoundException);
      expect(storage.getUploadUrl).not.toHaveBeenCalled();
    });
  });

  describe('requestIdentityDocumentUpload', () => {
    it('mints an upload URL scoped under identity-documents/<tenantId>/', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());
      storage.getUploadUrl.mockResolvedValue('https://storage.example/signed-put');

      const result = await service.requestIdentityDocumentUpload('req-1', {
        fileName: 'ghana-card.jpg',
        contentType: 'image/jpeg',
      });

      expect(storage.getUploadUrl).toHaveBeenCalledWith(
        expect.stringMatching(/^identity-documents\/tenant-1\/.+-ghana-card\.jpg$/),
        'image/jpeg',
      );
      expect(result.storageKey).toMatch(/^identity-documents\/tenant-1\//);
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

    it('does not touch applicationRepository.update when no resume/identity document was attached', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());
      candidates.list.mockResolvedValue([makeCandidate()]);
      applications.create.mockResolvedValue({ id: 'app-1' } as never);

      await service.apply('req-1', { firstName: 'Kwame', lastName: 'Mensah', email: 'kwame@example.com' });

      expect(applicationRepository.update).not.toHaveBeenCalled();
    });

    it('persists resume and identity document fields onto the created application when attached', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());
      candidates.list.mockResolvedValue([makeCandidate()]);
      applications.create.mockResolvedValue({ id: 'app-1' } as never);

      await service.apply('req-1', {
        firstName: 'Kwame',
        lastName: 'Mensah',
        email: 'kwame@example.com',
        resumeStorageKey: 'resumes/tenant-1/abc-resume.pdf',
        resumeFileName: 'resume.pdf',
        identityDocumentStorageKey: 'identity-documents/tenant-1/abc-id.jpg',
        identityDocumentFileName: 'ghana-card.jpg',
        identityDocumentType: 'NATIONAL_ID',
      });

      expect(applicationRepository.update).toHaveBeenCalledWith('tenant-1', 'app-1', {
        resumeStorageKey: 'resumes/tenant-1/abc-resume.pdf',
        resumeFileName: 'resume.pdf',
        identityDocumentStorageKey: 'identity-documents/tenant-1/abc-id.jpg',
        identityDocumentFileName: 'ghana-card.jpg',
        identityDocumentType: 'NATIONAL_ID',
      });
    });

    it('rejects a resumeStorageKey that does not belong to this requisition\'s tenant', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());

      await expect(
        service.apply('req-1', {
          firstName: 'Kwame',
          lastName: 'Mensah',
          email: 'kwame@example.com',
          resumeStorageKey: 'resumes/some-other-tenant/abc-resume.pdf',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(candidates.list).not.toHaveBeenCalled();
      expect(applications.create).not.toHaveBeenCalled();
    });

    it('rejects an identityDocumentStorageKey that does not belong to this requisition\'s tenant', async () => {
      requisitions.findOpenByIdAcrossTenants.mockResolvedValue(makeRequisition());

      await expect(
        service.apply('req-1', {
          firstName: 'Kwame',
          lastName: 'Mensah',
          email: 'kwame@example.com',
          identityDocumentStorageKey: 'identity-documents/some-other-tenant/abc-id.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
