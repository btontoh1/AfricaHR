import { PrismaService } from '@africahr/platform-database';
import { AssetRegisterReportRepository } from './asset-register-report.repository';

function decimal(value: number) {
  return { toNumber: () => value };
}

describe('AssetRegisterReportRepository', () => {
  let repository: AssetRegisterReportRepository;
  let tx: { companyAsset: { findMany: jest.Mock }; employee: { findMany: jest.Mock } };
  let prisma: { withTenantContext: jest.Mock };

  beforeEach(() => {
    tx = { companyAsset: { findMany: jest.fn() }, employee: { findMany: jest.fn() } };
    prisma = { withTenantContext: jest.fn((_tenantId, fn) => fn(tx)) };
    repository = new AssetRegisterReportRepository(prisma as unknown as PrismaService);
  });

  it('returns an empty array when there are no assets', async () => {
    tx.companyAsset.findMany.mockResolvedValue([]);

    const result = await repository.listAssets('tenant-1');

    expect(result).toEqual([]);
    expect(tx.employee.findMany).not.toHaveBeenCalled();
  });

  it('resolves the assigned employee name for an ASSIGNED asset', async () => {
    tx.companyAsset.findMany.mockResolvedValue([
      {
        id: 'asset-1',
        assetTag: 'LAP-001',
        name: 'MacBook Pro',
        category: 'Laptop',
        status: 'ASSIGNED',
        purchasePrice: decimal(2500),
        assignedEmployeeId: 'emp-1',
      },
    ]);
    tx.employee.findMany.mockResolvedValue([{ id: 'emp-1', firstName: 'Ama', lastName: 'Owusu' }]);

    const result = await repository.listAssets('tenant-1');

    expect(result).toEqual([
      {
        id: 'asset-1',
        assetTag: 'LAP-001',
        name: 'MacBook Pro',
        category: 'Laptop',
        status: 'ASSIGNED',
        purchasePrice: 2500,
        assignedEmployeeId: 'emp-1',
        assignedEmployeeName: 'Ama Owusu',
      },
    ]);
  });

  it('leaves assignedEmployeeName null for an unassigned asset', async () => {
    tx.companyAsset.findMany.mockResolvedValue([
      {
        id: 'asset-2',
        assetTag: 'LAP-002',
        name: 'ThinkPad',
        category: 'Laptop',
        status: 'AVAILABLE',
        purchasePrice: null,
        assignedEmployeeId: null,
      },
    ]);

    const result = await repository.listAssets('tenant-1');

    expect(result[0]).toMatchObject({ assignedEmployeeId: null, assignedEmployeeName: null, purchasePrice: null });
    expect(tx.employee.findMany).not.toHaveBeenCalled();
  });
});
