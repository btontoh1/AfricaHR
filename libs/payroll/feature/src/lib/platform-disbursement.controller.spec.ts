import { PlatformDisbursementController } from './platform-disbursement.controller';
import { DisbursementAttentionSummary, PlatformDisbursementService } from './platform-disbursement.service';

describe('PlatformDisbursementController', () => {
  let controller: PlatformDisbursementController;
  let disbursements: jest.Mocked<PlatformDisbursementService>;

  beforeEach(() => {
    disbursements = { listNeedingAttention: jest.fn() } as unknown as jest.Mocked<PlatformDisbursementService>;
    controller = new PlatformDisbursementController(disbursements);
  });

  it('delegates to PlatformDisbursementService.listNeedingAttention', async () => {
    const summary: DisbursementAttentionSummary = {
      items: [],
      counts: { stale: 0, critical: 0, failed: 0 },
    };
    disbursements.listNeedingAttention.mockResolvedValue(summary);

    await expect(controller.list()).resolves.toEqual(summary);
  });
});
