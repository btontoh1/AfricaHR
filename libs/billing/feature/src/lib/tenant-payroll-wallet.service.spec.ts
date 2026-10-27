import { TenantPayrollWallet, TenantWalletTopUp } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import {
  BillingTenantContactRepository,
  PlatformBillingRepository,
  TenantPayrollWalletRepository,
} from '@africahr/billing-data-access';
import { TenantPayrollWalletService } from './tenant-payroll-wallet.service';
import { PaystackClient } from './paystack-client';

describe('TenantPayrollWalletService', () => {
  let service: TenantPayrollWalletService;
  let wallets: jest.Mocked<TenantPayrollWalletRepository>;
  let tenantContacts: jest.Mocked<BillingTenantContactRepository>;
  let platformBilling: jest.Mocked<PlatformBillingRepository>;
  let paystack: jest.Mocked<PaystackClient>;
  let audit: jest.Mocked<AuditService>;

  beforeEach(() => {
    wallets = {
      listBalances: jest.fn(),
      creditBalance: jest.fn(),
      createTopUp: jest.fn(),
      listTopUpsForTenant: jest.fn(),
      updateTopUp: jest.fn(),
    } as unknown as jest.Mocked<TenantPayrollWalletRepository>;
    tenantContacts = {
      findAdminEmail: jest.fn(),
      findCurrency: jest.fn().mockResolvedValue('GHS'),
    } as unknown as jest.Mocked<BillingTenantContactRepository>;
    platformBilling = {
      findWalletTopUpByPaystackReference: jest.fn(),
    } as unknown as jest.Mocked<PlatformBillingRepository>;
    paystack = { initializeTransaction: jest.fn() } as unknown as jest.Mocked<PaystackClient>;
    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;

    service = new TenantPayrollWalletService(wallets, tenantContacts, platformBilling, paystack, audit);
  });

  describe('requestTopUp', () => {
    it('initializes a Paystack checkout and creates a PENDING top-up', async () => {
      tenantContacts.findAdminEmail.mockResolvedValue('admin@acme.com');
      paystack.initializeTransaction.mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/xyz',
        accessCode: 'code-1',
        reference: 'ref-1',
      });
      wallets.createTopUp.mockResolvedValue({ id: 'topup-1' } as TenantWalletTopUp);

      const result = await service.requestTopUp('tenant-1', 'GHS', 500, 'hr-1');

      expect(paystack.initializeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@acme.com', amount: 500, currency: 'GHS' }),
      );
      expect(wallets.createTopUp).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        currency: 'GHS',
        amount: 500,
        paystackReference: 'ref-1',
        checkoutUrl: 'https://checkout.paystack.com/xyz',
        createdBy: 'hr-1',
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'billing.wallet.topup_requested', resourceId: 'topup-1' }),
      );
      expect(result).toEqual({ id: 'topup-1' });
    });

    it('falls back to a placeholder email when the tenant has no admin', async () => {
      tenantContacts.findAdminEmail.mockResolvedValue(null);
      paystack.initializeTransaction.mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/xyz',
        accessCode: 'code-1',
        reference: 'ref-1',
      });
      wallets.createTopUp.mockResolvedValue({ id: 'topup-1' } as TenantWalletTopUp);

      await service.requestTopUp('tenant-1', 'GHS', 500);

      expect(paystack.initializeTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'tenant-tenant-1@parothr.local' }),
      );
    });

    it("rejects a currency other than the tenant's operating currency", async () => {
      tenantContacts.findCurrency.mockResolvedValue('GHS');

      await expect(service.requestTopUp('tenant-1', 'USD', 500)).rejects.toThrow(
        "Wallet top-ups must use this tenant's operating currency (GHS)",
      );
      expect(paystack.initializeTransaction).not.toHaveBeenCalled();
      expect(wallets.createTopUp).not.toHaveBeenCalled();
    });

    it('allows the request when the tenant has no resolvable currency', async () => {
      tenantContacts.findCurrency.mockResolvedValue(null);
      tenantContacts.findAdminEmail.mockResolvedValue('admin@acme.com');
      paystack.initializeTransaction.mockResolvedValue({
        authorizationUrl: 'https://checkout.paystack.com/xyz',
        accessCode: 'code-1',
        reference: 'ref-1',
      });
      wallets.createTopUp.mockResolvedValue({ id: 'topup-1' } as TenantWalletTopUp);

      await expect(service.requestTopUp('tenant-1', 'GHS', 500)).resolves.toEqual({ id: 'topup-1' });
    });
  });

  describe('creditTopUpByReference', () => {
    it('does nothing when the reference matches no top-up', async () => {
      platformBilling.findWalletTopUpByPaystackReference.mockResolvedValue(null);

      await service.creditTopUpByReference('unknown');

      expect(wallets.creditBalance).not.toHaveBeenCalled();
    });

    it('does nothing when the top-up is already PAID', async () => {
      platformBilling.findWalletTopUpByPaystackReference.mockResolvedValue({
        id: 'topup-1',
        tenantId: 'tenant-1',
        currency: 'GHS',
        amount: 500,
        status: 'PAID',
        paystackReference: 'ref-1',
        checkoutUrl: null,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.creditTopUpByReference('ref-1');

      expect(wallets.creditBalance).not.toHaveBeenCalled();
    });

    it('credits the wallet and marks the top-up PAID', async () => {
      platformBilling.findWalletTopUpByPaystackReference.mockResolvedValue({
        id: 'topup-1',
        tenantId: 'tenant-1',
        currency: 'GHS',
        amount: 500,
        status: 'PENDING',
        paystackReference: 'ref-1',
        checkoutUrl: null,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      wallets.creditBalance.mockResolvedValue({} as TenantPayrollWallet);

      await service.creditTopUpByReference('ref-1');

      expect(wallets.creditBalance).toHaveBeenCalledWith('tenant-1', 'GHS', 500);
      expect(wallets.updateTopUp).toHaveBeenCalledWith(
        'tenant-1',
        'topup-1',
        expect.objectContaining({ status: 'PAID' }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'billing.wallet.topped_up', resourceId: 'topup-1' }),
      );
    });
  });
});
