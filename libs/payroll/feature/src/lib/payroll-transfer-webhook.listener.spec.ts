import { PayrollDisbursementRepository, PayslipRepository } from '@africahr/payroll-data-access';
import { PayrollTransferWebhookListener } from './payroll-transfer-webhook.listener';

describe('PayrollTransferWebhookListener', () => {
  let listener: PayrollTransferWebhookListener;
  let disbursements: jest.Mocked<PayrollDisbursementRepository>;
  let payslips: jest.Mocked<PayslipRepository>;

  beforeEach(() => {
    disbursements = {
      findPayslipByPaystackTransferReference: jest.fn(),
    } as unknown as jest.Mocked<PayrollDisbursementRepository>;
    payslips = {
      recordDisbursementResult: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<PayslipRepository>;

    listener = new PayrollTransferWebhookListener(disbursements, payslips);
  });

  it('records a successful transfer against the matching pending payslip', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'PENDING',
    });

    await listener.handleTransferUpdated({ reference: 'ref-123', status: 'success' });

    expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'SUCCESS');
  });

  it('records a failed transfer against the matching pending payslip', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'PENDING',
    });

    await listener.handleTransferUpdated({ reference: 'ref-123', status: 'failed' });

    expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'FAILED');
  });

  it('ignores a reference that matches no payslip', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue(null);

    await listener.handleTransferUpdated({ reference: 'unknown', status: 'success' });

    expect(payslips.recordDisbursementResult).not.toHaveBeenCalled();
  });

  it('ignores a duplicate webhook delivery for an already-resolved payslip', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'SUCCESS',
    });

    await listener.handleTransferUpdated({ reference: 'ref-123', status: 'success' });

    expect(payslips.recordDisbursementResult).not.toHaveBeenCalled();
  });

  it('does not throw when recording the result fails', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'PENDING',
    });
    payslips.recordDisbursementResult.mockRejectedValue(new Error('boom'));

    await expect(
      listener.handleTransferUpdated({ reference: 'ref-123', status: 'success' }),
    ).resolves.toBeUndefined();
  });
});
