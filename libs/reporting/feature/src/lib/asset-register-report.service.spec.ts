import { AssetRegisterReportRepository } from '@africahr/reporting-data-access';
import { AssetRegisterReportService } from './asset-register-report.service';

describe('AssetRegisterReportService', () => {
  let service: AssetRegisterReportService;
  let assets: jest.Mocked<AssetRegisterReportRepository>;

  beforeEach(() => {
    assets = { listAssets: jest.fn() } as unknown as jest.Mocked<AssetRegisterReportRepository>;
    service = new AssetRegisterReportService(assets);
  });

  it('returns zero counts and total for no assets', async () => {
    assets.listAssets.mockResolvedValue([]);

    const result = await service.generate('tenant-1', {});

    expect(result).toEqual({ assets: [], countsByStatus: [], totalPurchasePrice: 0 });
  });

  it('counts assets by status and sums purchase price, treating a null price as zero', async () => {
    assets.listAssets.mockResolvedValue([
      {
        id: 'a1',
        assetTag: 'LAP-001',
        name: 'MacBook',
        category: 'Laptop',
        status: 'ASSIGNED',
        purchasePrice: 2000,
        assignedEmployeeId: 'emp-1',
        assignedEmployeeName: 'Ama Owusu',
      },
      {
        id: 'a2',
        assetTag: 'LAP-002',
        name: 'ThinkPad',
        category: 'Laptop',
        status: 'AVAILABLE',
        purchasePrice: null,
        assignedEmployeeId: null,
        assignedEmployeeName: null,
      },
      {
        id: 'a3',
        assetTag: 'LAP-003',
        name: 'XPS 13',
        category: 'Laptop',
        status: 'ASSIGNED',
        purchasePrice: 1500,
        assignedEmployeeId: 'emp-2',
        assignedEmployeeName: 'Kofi Mensah',
      },
    ]);

    const result = await service.generate('tenant-1', {});

    expect(result.totalPurchasePrice).toBe(3500);
    expect(result.countsByStatus).toEqual(
      expect.arrayContaining([
        { status: 'ASSIGNED', count: 2 },
        { status: 'AVAILABLE', count: 1 },
      ]),
    );
  });
});
