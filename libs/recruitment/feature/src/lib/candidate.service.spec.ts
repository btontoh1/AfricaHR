import { NotFoundException } from '@nestjs/common';
import { Candidate } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { CandidateRepository } from '@africahr/recruitment-data-access';
import { CandidateService } from './candidate.service';

describe('CandidateService', () => {
  let service: CandidateService;
  let candidates: jest.Mocked<CandidateRepository>;
  let audit: jest.Mocked<AuditService>;

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

  beforeEach(() => {
    candidates = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    } as unknown as jest.Mocked<CandidateRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new CandidateService(candidates, audit);
  });

  describe('create', () => {
    it('creates the candidate and audits on success', async () => {
      const created = makeCandidate();
      candidates.create.mockResolvedValue(created);

      await service.create(
        'tenant-1',
        { firstName: 'Ama', lastName: 'Boateng', email: 'ama@example.com' },
        'hr-1',
      );

      expect(candidates.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ firstName: 'Ama', lastName: 'Boateng', email: 'ama@example.com' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.candidate.created', resourceId: created.id }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when the candidate does not exist', async () => {
      candidates.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the candidate does not exist', async () => {
      candidates.findById.mockResolvedValue(null);

      await expect(
        service.update('tenant-1', 'missing', { firstName: 'New' }),
      ).rejects.toThrow(NotFoundException);
      expect(candidates.update).not.toHaveBeenCalled();
    });

    it('updates the candidate and audits on success', async () => {
      candidates.findById.mockResolvedValue(makeCandidate());
      candidates.update.mockResolvedValue(makeCandidate({ firstName: 'New' }));

      await service.update('tenant-1', 'cand-1', { firstName: 'New' }, 'hr-1');

      expect(candidates.update).toHaveBeenCalledWith(
        'tenant-1',
        'cand-1',
        expect.objectContaining({ firstName: 'New' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'recruitment.candidate.updated' }),
      );
    });
  });
});
