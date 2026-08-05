import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { PayrollAttendanceRecordRepository } from './payroll-attendance-record.repository';

describe('PayrollAttendanceRecordRepository', () => {
  let repository: PayrollAttendanceRecordRepository;
  let tx: { attendanceRecord: { findMany: jest.Mock }; attendancePolicy: { findUnique: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = {
      attendanceRecord: { findMany: jest.fn().mockResolvedValue([]) },
      attendancePolicy: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new PayrollAttendanceRecordRepository(prisma as unknown as PrismaService);
  });

  describe('sumOvertimeHours', () => {
    it('queries only non-deleted records within the period', async () => {
      const periodStart = new Date('2026-02-01');
      const periodEnd = new Date('2026-02-28');

      await repository.sumOvertimeHours('tenant-1', 'emp-1', periodStart, periodEnd);

      expect(tx.attendanceRecord.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          employeeId: 'emp-1',
          deletedAt: null,
          date: { gte: periodStart, lte: periodEnd },
        },
        select: { overtimeHours: true },
      });
    });

    it('sums overtimeHours across every matching record', async () => {
      tx.attendanceRecord.findMany.mockResolvedValue([
        { overtimeHours: new Prisma.Decimal(2) },
        { overtimeHours: new Prisma.Decimal(1.5) },
      ]);

      const result = await repository.sumOvertimeHours('tenant-1', 'emp-1', new Date(), new Date());

      expect(result).toBe(3.5);
    });

    it('treats a null overtimeHours (not yet clocked out) as 0', async () => {
      tx.attendanceRecord.findMany.mockResolvedValue([{ overtimeHours: null }]);

      const result = await repository.sumOvertimeHours('tenant-1', 'emp-1', new Date(), new Date());

      expect(result).toBe(0);
    });

    it('returns 0 when there are no matching records', async () => {
      const result = await repository.sumOvertimeHours('tenant-1', 'emp-1', new Date(), new Date());

      expect(result).toBe(0);
    });
  });

  describe('findStandardDailyHours', () => {
    it('returns the tenant policy standardDailyHours as a number', async () => {
      tx.attendancePolicy.findUnique.mockResolvedValue({ standardDailyHours: new Prisma.Decimal(8) });

      const result = await repository.findStandardDailyHours('tenant-1');

      expect(tx.attendancePolicy.findUnique).toHaveBeenCalledWith({ where: { tenantId: 'tenant-1' } });
      expect(result).toBe(8);
    });

    it('returns null when the tenant has no AttendancePolicy configured', async () => {
      const result = await repository.findStandardDailyHours('tenant-1');

      expect(result).toBeNull();
    });
  });
});
