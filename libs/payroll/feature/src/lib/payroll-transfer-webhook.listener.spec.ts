import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payslip } from '@prisma/client';
import {
  PayrollDisbursementRepository,
  PayrollEmployeeRepository,
  PayRunRepository,
  PayslipRepository,
} from '@africahr/payroll-data-access';
import { PAYROLL_DISBURSEMENT_FAILED_EVENT, PayrollTransferWebhookListener } from './payroll-transfer-webhook.listener';
import { PaystackTransferClient } from './paystack-transfer-client';

describe('PayrollTransferWebhookListener', () => {
  let listener: PayrollTransferWebhookListener;
  let disbursements: jest.Mocked<PayrollDisbursementRepository>;
  let payslips: jest.Mocked<PayslipRepository>;
  let payRuns: jest.Mocked<PayRunRepository>;
  let employees: jest.Mocked<PayrollEmployeeRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;
  let paystack: jest.Mocked<PaystackTransferClient>;

  function makeUpdatedPayslip(overrides: Partial<Payslip> = {}): Payslip {
    return {
      id: 'payslip-1',
      tenantId: 'tenant-1',
      payRunId: 'run-1',
      employeeId: 'emp-1',
      disbursementStatus: 'FAILED',
      ...overrides,
    } as Payslip;
  }

  beforeEach(() => {
    disbursements = {
      findPayslipByPaystackTransferReference: jest.fn(),
      listStalePendingDisbursements: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<PayrollDisbursementRepository>;
    payslips = {
      recordDisbursementResult: jest.fn().mockResolvedValue(makeUpdatedPayslip()),
    } as unknown as jest.Mocked<PayslipRepository>;
    payRuns = {
      findById: jest.fn().mockResolvedValue({
        periodStart: new Date('2026-01-01'),
        periodEnd: new Date('2026-01-31'),
      }),
    } as unknown as jest.Mocked<PayRunRepository>;
    employees = {
      findById: jest.fn().mockResolvedValue({ id: 'emp-1', firstName: 'Kwame', lastName: 'Asante' }),
    } as unknown as jest.Mocked<PayrollEmployeeRepository>;
    eventEmitter = { emit: jest.fn() } as unknown as jest.Mocked<EventEmitter2>;
    paystack = { verifyTransfer: jest.fn() } as unknown as jest.Mocked<PaystackTransferClient>;

    listener = new PayrollTransferWebhookListener(
      disbursements,
      payslips,
      payRuns,
      employees,
      eventEmitter,
      paystack,
    );
  });

  it('records a successful transfer against the matching pending payslip and does not notify', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'PENDING',
    });
    payslips.recordDisbursementResult.mockResolvedValue(makeUpdatedPayslip({ disbursementStatus: 'SUCCESS' }));

    await listener.handleTransferUpdated({ reference: 'ref-123', status: 'success' });

    expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'SUCCESS');
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('records a failed transfer and emits a notification event with the employee and pay run period', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'PENDING',
    });

    await listener.handleTransferUpdated({ reference: 'ref-123', status: 'failed' });

    expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'FAILED');
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      PAYROLL_DISBURSEMENT_FAILED_EVENT,
      expect.objectContaining({
        tenantId: 'tenant-1',
        employeeName: 'Kwame Asante',
        periodStart: '2026-01-01',
        periodEnd: '2026-01-31',
      }),
    );
  });

  it('does not notify when the pay run or employee can no longer be found', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'PENDING',
    });
    payRuns.findById.mockResolvedValue(null);

    await listener.handleTransferUpdated({ reference: 'ref-123', status: 'failed' });

    expect(eventEmitter.emit).not.toHaveBeenCalled();
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

  it('does not throw when recording the result fails, and does not notify', async () => {
    disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
      id: 'payslip-1',
      tenantId: 'tenant-1',
      disbursementStatus: 'PENDING',
    });
    payslips.recordDisbursementResult.mockRejectedValue(new Error('boom'));

    await expect(
      listener.handleTransferUpdated({ reference: 'ref-123', status: 'failed' }),
    ).resolves.toBeUndefined();
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  describe('reconcileStalePendingDisbursements', () => {
    it('resolves a stale pending disbursement that Paystack reports as successful', async () => {
      disbursements.listStalePendingDisbursements.mockResolvedValue([
        { id: 'payslip-1', tenantId: 'tenant-1', paystackTransferReference: 'ref-123' },
      ]);
      disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
        id: 'payslip-1',
        tenantId: 'tenant-1',
        disbursementStatus: 'PENDING',
      });
      paystack.verifyTransfer.mockResolvedValue({ status: 'success' });

      await listener.reconcileStalePendingDisbursements();

      expect(paystack.verifyTransfer).toHaveBeenCalledWith('ref-123');
      expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'SUCCESS');
    });

    it('resolves a stale pending disbursement Paystack reports as failed, and notifies', async () => {
      disbursements.listStalePendingDisbursements.mockResolvedValue([
        { id: 'payslip-1', tenantId: 'tenant-1', paystackTransferReference: 'ref-123' },
      ]);
      disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
        id: 'payslip-1',
        tenantId: 'tenant-1',
        disbursementStatus: 'PENDING',
      });
      paystack.verifyTransfer.mockResolvedValue({ status: 'reversed' });

      await listener.reconcileStalePendingDisbursements();

      expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-1', 'FAILED');
      expect(eventEmitter.emit).toHaveBeenCalledWith(PAYROLL_DISBURSEMENT_FAILED_EVENT, expect.anything());
    });

    it('leaves a disbursement alone when Paystack still reports it pending', async () => {
      disbursements.listStalePendingDisbursements.mockResolvedValue([
        { id: 'payslip-1', tenantId: 'tenant-1', paystackTransferReference: 'ref-123' },
      ]);
      paystack.verifyTransfer.mockResolvedValue({ status: 'pending' });

      await listener.reconcileStalePendingDisbursements();

      expect(disbursements.findPayslipByPaystackTransferReference).not.toHaveBeenCalled();
      expect(payslips.recordDisbursementResult).not.toHaveBeenCalled();
    });

    it("does not act on a payslip a webhook already resolved between the sweep's query and processing it", async () => {
      disbursements.listStalePendingDisbursements.mockResolvedValue([
        { id: 'payslip-1', tenantId: 'tenant-1', paystackTransferReference: 'ref-123' },
      ]);
      disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
        id: 'payslip-1',
        tenantId: 'tenant-1',
        disbursementStatus: 'SUCCESS',
      });
      paystack.verifyTransfer.mockResolvedValue({ status: 'success' });

      await listener.reconcileStalePendingDisbursements();

      expect(payslips.recordDisbursementResult).not.toHaveBeenCalled();
    });

    it('does not let one item\'s Paystack failure stop the rest of the sweep', async () => {
      disbursements.listStalePendingDisbursements.mockResolvedValue([
        { id: 'payslip-1', tenantId: 'tenant-1', paystackTransferReference: 'ref-1' },
        { id: 'payslip-2', tenantId: 'tenant-1', paystackTransferReference: 'ref-2' },
      ]);
      disbursements.findPayslipByPaystackTransferReference.mockResolvedValue({
        id: 'payslip-2',
        tenantId: 'tenant-1',
        disbursementStatus: 'PENDING',
      });
      paystack.verifyTransfer
        .mockRejectedValueOnce(new Error('Paystack is down'))
        .mockResolvedValueOnce({ status: 'success' });

      await expect(listener.reconcileStalePendingDisbursements()).resolves.toBeUndefined();

      expect(paystack.verifyTransfer).toHaveBeenCalledTimes(2);
      expect(payslips.recordDisbursementResult).toHaveBeenCalledWith('tenant-1', 'payslip-2', 'SUCCESS');
    });

    it('does not throw when listing stale disbursements itself fails', async () => {
      disbursements.listStalePendingDisbursements.mockRejectedValue(new Error('boom'));

      await expect(listener.reconcileStalePendingDisbursements()).resolves.toBeUndefined();

      expect(paystack.verifyTransfer).not.toHaveBeenCalled();
    });
  });
});
