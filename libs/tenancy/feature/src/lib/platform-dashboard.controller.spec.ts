import { PlatformDashboardController } from './platform-dashboard.controller';
import { PlatformDashboardService, PlatformDashboardSummary } from './platform-dashboard.service';

describe('PlatformDashboardController', () => {
  let controller: PlatformDashboardController;
  let dashboard: jest.Mocked<PlatformDashboardService>;

  beforeEach(() => {
    dashboard = {
      getSummary: jest.fn(),
    } as unknown as jest.Mocked<PlatformDashboardService>;

    controller = new PlatformDashboardController(dashboard);
  });

  it('delegates to PlatformDashboardService.getSummary', async () => {
    const summary: PlatformDashboardSummary = {
      recentTenants: [],
      totalTenants: 0,
      storage: null,
      databaseSizeBytes: null,
      health: { api: true, database: true, redis: true },
    };
    dashboard.getSummary.mockResolvedValue(summary);

    await expect(controller.get()).resolves.toEqual(summary);
  });
});
