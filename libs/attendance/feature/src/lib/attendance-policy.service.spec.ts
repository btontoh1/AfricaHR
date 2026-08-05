import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendancePolicy, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { AttendancePolicyRepository } from '@africahr/attendance-data-access';
import { AttendancePolicyService } from './attendance-policy.service';

describe('AttendancePolicyService', () => {
  let service: AttendancePolicyService;
  let policies: jest.Mocked<AttendancePolicyRepository>;
  let audit: jest.Mocked<AuditService>;

  function makePolicy(overrides: Partial<AttendancePolicy> = {}): AttendancePolicy {
    return {
      id: 'policy-1',
      tenantId: 'tenant-1',
      standardDailyHours: new Prisma.Decimal(8),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as AttendancePolicy;
  }

  beforeEach(() => {
    policies = { upsert: jest.fn(), find: jest.fn() } as unknown as jest.Mocked<AttendancePolicyRepository>;
    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    service = new AttendancePolicyService(policies, audit);
  });

  describe('upsert', () => {
    it('audits on success', async () => {
      const policy = makePolicy();
      policies.upsert.mockResolvedValue(policy);

      await service.upsert('tenant-1', { standardDailyHours: 8 }, 'hr-1');

      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'attendance.policy.upserted', resourceId: policy.id }),
      );
    });

    it('clears geofencing when all three fields are omitted', async () => {
      policies.upsert.mockResolvedValue(makePolicy());

      await service.upsert('tenant-1', { standardDailyHours: 8 }, 'hr-1');

      expect(policies.upsert).toHaveBeenCalledWith('tenant-1', {
        standardDailyHours: 8,
        geofenceLatitude: null,
        geofenceLongitude: null,
        geofenceRadiusMeters: null,
        geofenceLocationName: null,
        actorId: 'hr-1',
      });
    });

    it('sets geofencing when all three fields are given', async () => {
      policies.upsert.mockResolvedValue(makePolicy());

      await service.upsert(
        'tenant-1',
        { standardDailyHours: 8, geofenceLatitude: 5.6, geofenceLongitude: -0.19, geofenceRadiusMeters: 150 },
        'hr-1',
      );

      expect(policies.upsert).toHaveBeenCalledWith('tenant-1', {
        standardDailyHours: 8,
        geofenceLatitude: 5.6,
        geofenceLongitude: -0.19,
        geofenceRadiusMeters: 150,
        geofenceLocationName: null,
        actorId: 'hr-1',
      });
    });

    it('passes the location name through independently of the geofence fields', async () => {
      policies.upsert.mockResolvedValue(makePolicy());

      await service.upsert(
        'tenant-1',
        { standardDailyHours: 8, geofenceLocationName: 'East Legon Office' },
        'hr-1',
      );

      expect(policies.upsert).toHaveBeenCalledWith('tenant-1', {
        standardDailyHours: 8,
        geofenceLatitude: null,
        geofenceLongitude: null,
        geofenceRadiusMeters: null,
        geofenceLocationName: 'East Legon Office',
        actorId: 'hr-1',
      });
    });

    it('rejects when only some geofence fields are given', async () => {
      await expect(
        service.upsert('tenant-1', { standardDailyHours: 8, geofenceLatitude: 5.6 }, 'hr-1'),
      ).rejects.toThrow(BadRequestException);
      expect(policies.upsert).not.toHaveBeenCalled();
    });
  });

  describe('find', () => {
    it('throws NotFoundException when no policy is configured', async () => {
      policies.find.mockResolvedValue(null);

      await expect(service.find('tenant-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the policy when configured', async () => {
      const policy = makePolicy();
      policies.find.mockResolvedValue(policy);

      await expect(service.find('tenant-1')).resolves.toEqual(policy);
    });
  });
});
