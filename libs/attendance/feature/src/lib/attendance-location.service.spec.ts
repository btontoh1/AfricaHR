import { NotFoundException } from '@nestjs/common';
import { AttendanceLocation, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { AttendanceLocationRepository } from '@africahr/attendance-data-access';
import { AttendanceLocationService } from './attendance-location.service';

describe('AttendanceLocationService', () => {
  let service: AttendanceLocationService;
  let locations: jest.Mocked<AttendanceLocationRepository>;
  let audit: jest.Mocked<AuditService>;

  function makeLocation(overrides: Partial<AttendanceLocation> = {}): AttendanceLocation {
    return {
      id: 'loc-1',
      tenantId: 'tenant-1',
      name: 'HQ',
      latitude: new Prisma.Decimal(5.6),
      longitude: new Prisma.Decimal(-0.19),
      radiusMeters: 150,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      updatedBy: null,
      ...overrides,
    } as AttendanceLocation;
  }

  beforeEach(() => {
    locations = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<AttendanceLocationRepository>;
    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    service = new AttendanceLocationService(locations, audit);
  });

  describe('list', () => {
    it('lists the tenant locations', async () => {
      const result = [makeLocation()];
      locations.list.mockResolvedValue(result);

      await expect(service.list('tenant-1')).resolves.toEqual(result);
    });
  });

  describe('create', () => {
    it('creates and audits', async () => {
      const location = makeLocation();
      locations.create.mockResolvedValue(location);

      const dto = { name: 'HQ', latitude: 5.6, longitude: -0.19, radiusMeters: 150 };
      await service.create('tenant-1', dto, 'hr-1');

      expect(locations.create).toHaveBeenCalledWith('tenant-1', { ...dto, actorId: 'hr-1' });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'attendance.location.created', resourceId: location.id }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the location does not exist', async () => {
      locations.findById.mockResolvedValue(null);

      await expect(service.update('tenant-1', 'loc-1', { name: 'Renamed' }, 'hr-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(locations.update).not.toHaveBeenCalled();
    });

    it('updates and audits when the location exists', async () => {
      const location = makeLocation();
      locations.findById.mockResolvedValue(location);
      locations.update.mockResolvedValue({ ...location, name: 'Renamed' });

      await service.update('tenant-1', 'loc-1', { name: 'Renamed' }, 'hr-1');

      expect(locations.update).toHaveBeenCalledWith('tenant-1', 'loc-1', { name: 'Renamed', actorId: 'hr-1' });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'attendance.location.updated', resourceId: 'loc-1' }),
      );
    });
  });

  describe('delete', () => {
    it('throws NotFoundException when the location does not exist', async () => {
      locations.findById.mockResolvedValue(null);

      await expect(service.delete('tenant-1', 'loc-1', 'hr-1')).rejects.toThrow(NotFoundException);
      expect(locations.delete).not.toHaveBeenCalled();
    });

    it('deletes and audits when the location exists', async () => {
      locations.findById.mockResolvedValue(makeLocation());

      await service.delete('tenant-1', 'loc-1', 'hr-1');

      expect(locations.delete).toHaveBeenCalledWith('tenant-1', 'loc-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'attendance.location.deleted', resourceId: 'loc-1' }),
      );
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      locations.findById.mockResolvedValue(null);

      await expect(service.findById('tenant-1', 'loc-1')).rejects.toThrow(NotFoundException);
    });

    it('returns the location when found', async () => {
      const location = makeLocation();
      locations.findById.mockResolvedValue(location);

      await expect(service.findById('tenant-1', 'loc-1')).resolves.toEqual(location);
    });
  });
});
