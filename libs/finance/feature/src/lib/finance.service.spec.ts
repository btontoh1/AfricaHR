import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import {
  BankReconciliationRepository,
  GlAccountRepository,
  GlBudgetRepository,
  GlFxRevaluationRepository,
  GlHomeCurrencyRepository,
  GlJournalEntryRepository,
  GlPeriodCloseRepository,
  GlRecurringJournalEntryRepository,
} from '@africahr/finance-data-access';
import { GlAccountCode } from '@africahr/finance-domain';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let accounts: jest.Mocked<GlAccountRepository>;
  let journalEntries: jest.Mocked<GlJournalEntryRepository>;
  let periodCloses: jest.Mocked<GlPeriodCloseRepository>;
  let budgets: jest.Mocked<GlBudgetRepository>;
  let bankReconciliations: jest.Mocked<BankReconciliationRepository>;
  let recurringEntries: jest.Mocked<GlRecurringJournalEntryRepository>;
  let homeCurrencies: jest.Mocked<GlHomeCurrencyRepository>;
  let fxRevaluations: jest.Mocked<GlFxRevaluationRepository>;
  let audit: jest.Mocked<AuditService>;

  const actor: RequestUser = {
    sub: 'user-1',
    email: 'admin@acme.com',
    role: SystemRole.TENANT_ADMIN,
    tenantId: 'tenant-1',
    organizationId: null,
    iat: 1,
    exp: 2,
  };

  const accountIdByCode = new Map<string, string>([
    [GlAccountCode.CASH_AND_BANK, 'acc-cash'],
    [GlAccountCode.ACCOUNTS_RECEIVABLE, 'acc-ar'],
    [GlAccountCode.PAYROLL_LIABILITIES_PAYABLE, 'acc-payroll-liab'],
    [GlAccountCode.TAX_PAYABLE, 'acc-tax'],
    [GlAccountCode.ACCOUNTS_PAYABLE, 'acc-ap'],
    [GlAccountCode.REVENUE, 'acc-revenue'],
    [GlAccountCode.PAYROLL_EXPENSE, 'acc-payroll-exp'],
    [GlAccountCode.GENERAL_EXPENSE, 'acc-general-exp'],
    [GlAccountCode.FX_GAIN_LOSS, 'acc-fx-gain-loss'],
  ]);

  beforeEach(() => {
    accounts = {
      ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
      listByTenant: jest.fn(),
      mapCodesToIds: jest.fn().mockResolvedValue(accountIdByCode),
      updateName: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<GlAccountRepository>;

    journalEntries = {
      createIfNotExists: jest.fn(),
      list: jest.fn(),
      listLinesInRange: jest.fn(),
      findById: jest.fn(),
      voidEntry: jest.fn(),
      listCashLinesForReconciliation: jest.fn().mockResolvedValue([]),
      findLineById: jest.fn(),
      setLineReconciliation: jest.fn(),
      listClearedLines: jest.fn().mockResolvedValue([]),
      releaseClearedLines: jest.fn(),
      listLinesUpTo: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<GlJournalEntryRepository>;

    periodCloses = {
      findByOrganization: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<GlPeriodCloseRepository>;

    budgets = {
      upsert: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<GlBudgetRepository>;

    bankReconciliations = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<BankReconciliationRepository>;

    recurringEntries = {
      create: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
      setActive: jest.fn(),
      delete: jest.fn(),
      markRun: jest.fn(),
      listDue: jest.fn(),
    } as unknown as jest.Mocked<GlRecurringJournalEntryRepository>;

    homeCurrencies = {
      upsert: jest.fn(),
      findByOrganization: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<GlHomeCurrencyRepository>;

    fxRevaluations = {
      create: jest.fn(),
      findLatest: jest.fn().mockResolvedValue(null),
      list: jest.fn(),
    } as unknown as jest.Mocked<GlFxRevaluationRepository>;

    audit = { record: jest.fn() } as unknown as jest.Mocked<AuditService>;

    service = new FinanceService(
      accounts,
      journalEntries,
      periodCloses,
      budgets,
      bankReconciliations,
      recurringEntries,
      homeCurrencies,
      fxRevaluations,
      audit,
    );
  });

  describe('postPayrollDisbursement', () => {
    it('ensures default accounts, resolves codes, and posts a balanced entry', async () => {
      journalEntries.createIfNotExists.mockResolvedValue({ id: 'entry-1' } as never);

      await service.postPayrollDisbursement('tenant-1', {
        organizationId: 'org-1',
        payRunId: 'payrun-1',
        payDate: new Date('2026-01-31'),
        currency: 'GHS',
        totals: { totalGrossPay: 1000, totalEmployerOnlyCost: 130, totalNetPay: 850 },
      });

      expect(accounts.ensureDefaultAccounts).toHaveBeenCalledWith('tenant-1');
      const call = journalEntries.createIfNotExists.mock.calls[0][1];
      expect(call.sourceType).toBe('PAY_RUN_DISBURSED');
      expect(call.sourceId).toBe('payrun-1:GHS');
      expect(call.currency).toBe('GHS');
      const debits = call.lines.reduce((sum, l) => sum + Number(l.debit), 0);
      const credits = call.lines.reduce((sum, l) => sum + Number(l.credit), 0);
      expect(debits).toBeCloseTo(credits, 2);
    });
  });

  describe('postInvoiceSent / postInvoicePaid', () => {
    it('posts AR/Revenue/Tax on sent', async () => {
      journalEntries.createIfNotExists.mockResolvedValue({ id: 'entry-2' } as never);

      await service.postInvoiceSent('tenant-1', {
        organizationId: 'org-1',
        invoiceId: 'inv-1',
        entryDate: new Date('2026-02-01'),
        currency: 'GHS',
        subtotal: 1000,
        taxAmount: 150,
        total: 1150,
      });

      const call = journalEntries.createIfNotExists.mock.calls[0][1];
      expect(call.sourceType).toBe('CUSTOMER_INVOICE_SENT');
      expect(call.sourceId).toBe('inv-1');
      expect(call.lines).toHaveLength(3);
    });

    it('posts Cash/AR on paid', async () => {
      journalEntries.createIfNotExists.mockResolvedValue({ id: 'entry-3' } as never);

      await service.postInvoicePaid('tenant-1', {
        organizationId: 'org-1',
        invoiceId: 'inv-1',
        entryDate: new Date('2026-02-15'),
        currency: 'GHS',
        subtotal: 1000,
        taxAmount: 150,
        total: 1150,
      });

      const call = journalEntries.createIfNotExists.mock.calls[0][1];
      expect(call.sourceType).toBe('CUSTOMER_INVOICE_PAID');
      expect(call.lines).toHaveLength(2);
    });
  });

  describe('postVendorBillApproved / postVendorBillPaid', () => {
    it('posts General Expense/Accounts Payable on approved', async () => {
      journalEntries.createIfNotExists.mockResolvedValue({ id: 'entry-4' } as never);

      await service.postVendorBillApproved('tenant-1', {
        organizationId: 'org-1',
        billId: 'bill-1',
        entryDate: new Date('2026-02-01'),
        currency: 'GHS',
        total: 1150,
      });

      const call = journalEntries.createIfNotExists.mock.calls[0][1];
      expect(call.sourceType).toBe('VENDOR_BILL_APPROVED');
      expect(call.sourceId).toBe('bill-1');
      expect(call.lines).toHaveLength(2);
    });

    it('posts Accounts Payable/Cash on paid', async () => {
      journalEntries.createIfNotExists.mockResolvedValue({ id: 'entry-5' } as never);

      await service.postVendorBillPaid('tenant-1', {
        organizationId: 'org-1',
        billId: 'bill-1',
        entryDate: new Date('2026-02-15'),
        currency: 'GHS',
        total: 1150,
      });

      const call = journalEntries.createIfNotExists.mock.calls[0][1];
      expect(call.sourceType).toBe('VENDOR_BILL_PAID');
      expect(call.lines).toHaveLength(2);
    });
  });

  describe('createManualEntry', () => {
    const dto = {
      organizationId: 'org-1',
      entryDate: '2026-03-01',
      description: 'Office rent',
      currency: 'GHS',
      lines: [
        { accountCode: GlAccountCode.PAYROLL_EXPENSE, debit: 500 },
        { accountCode: GlAccountCode.CASH_AND_BANK, credit: 500 },
      ],
    };

    it('rejects an entry where debits and credits do not balance', async () => {
      const unbalanced = { ...dto, lines: [{ accountCode: GlAccountCode.PAYROLL_EXPENSE, debit: 500 }, { accountCode: GlAccountCode.CASH_AND_BANK, credit: 400 }] };
      await expect(service.createManualEntry('tenant-1', unbalanced, actor)).rejects.toThrow(BadRequestException);
      expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
    });

    it('rejects a line with both debit and credit set', async () => {
      const bothSet = {
        ...dto,
        lines: [
          { accountCode: GlAccountCode.PAYROLL_EXPENSE, debit: 500, credit: 500 },
          { accountCode: GlAccountCode.CASH_AND_BANK, credit: 500 },
        ],
      };
      await expect(service.createManualEntry('tenant-1', bothSet, actor)).rejects.toThrow(BadRequestException);
    });

    it('rejects a line with neither debit nor credit set', async () => {
      const neitherSet = {
        ...dto,
        lines: [
          { accountCode: GlAccountCode.PAYROLL_EXPENSE },
          { accountCode: GlAccountCode.CASH_AND_BANK, credit: 500 },
        ],
      };
      await expect(service.createManualEntry('tenant-1', neitherSet, actor)).rejects.toThrow(BadRequestException);
    });

    it('creates a balanced entry, records an audit entry, and returns the response DTO', async () => {
      journalEntries.createIfNotExists.mockResolvedValue({
        id: 'entry-4',
        organizationId: 'org-1',
        entryDate: new Date('2026-03-01'),
        description: 'Office rent',
        currency: 'GHS',
        sourceType: 'MANUAL',
        sourceId: 'generated-uuid',
        lines: [
          {
            debit: new Prisma.Decimal(500),
            credit: new Prisma.Decimal(0),
            account: { code: GlAccountCode.PAYROLL_EXPENSE, name: 'Payroll Expense' },
          },
          {
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(500),
            account: { code: GlAccountCode.CASH_AND_BANK, name: 'Cash and Bank' },
          },
        ],
      } as never);

      const result = await service.createManualEntry('tenant-1', dto, actor);

      expect(accounts.ensureDefaultAccounts).toHaveBeenCalledWith('tenant-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', action: 'finance.journal_entry.created' }),
      );
      expect(result.id).toBe('entry-4');
      expect(result.lines).toHaveLength(2);
    });

    it('translates a foreign-key violation on organizationId into a NotFoundException', async () => {
      const fkError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2003',
        message: 'mock',
      });
      journalEntries.createIfNotExists.mockRejectedValue(fkError);

      await expect(service.createManualEntry('tenant-1', dto, actor)).rejects.toThrow(NotFoundException);
    });

    it('rejects posting to a date on or before the organization\'s closed-through date', async () => {
      periodCloses.findByOrganization.mockResolvedValue({
        closedThrough: new Date('2026-03-31'),
      } as never);
      const backdated = { ...dto, entryDate: '2026-03-15' };

      await expect(service.createManualEntry('tenant-1', backdated, actor)).rejects.toThrow(BadRequestException);
      expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
    });

    it('allows posting to a date after the organization\'s closed-through date', async () => {
      periodCloses.findByOrganization.mockResolvedValue({
        closedThrough: new Date('2026-02-28'),
      } as never);
      journalEntries.createIfNotExists.mockResolvedValue({
        id: 'entry-5',
        organizationId: 'org-1',
        entryDate: new Date('2026-03-01'),
        description: 'Office rent',
        currency: 'GHS',
        sourceType: 'MANUAL',
        sourceId: 'generated-uuid',
        lines: [],
      } as never);

      await expect(service.createManualEntry('tenant-1', dto, actor)).resolves.toBeDefined();
    });
  });

  describe('createAccount', () => {
    it('creates a new account and records an audit entry', async () => {
      accounts.create.mockResolvedValue({
        id: 'acc-rent',
        code: '5100',
        name: 'Rent Expense',
        type: 'EXPENSE',
      } as never);

      const result = await service.createAccount(
        'tenant-1',
        { code: '5100', name: 'Rent Expense', type: 'EXPENSE' },
        actor,
      );

      expect(accounts.ensureDefaultAccounts).toHaveBeenCalledWith('tenant-1');
      expect(accounts.create).toHaveBeenCalledWith('tenant-1', {
        code: '5100',
        name: 'Rent Expense',
        type: 'EXPENSE',
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', action: 'finance.account.created', resourceId: 'acc-rent' }),
      );
      expect(result).toEqual({ id: 'acc-rent', code: '5100', name: 'Rent Expense', type: 'EXPENSE' });
    });

    it('translates a duplicate code (P2002) into a ConflictException', async () => {
      const duplicateError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2002',
        message: 'mock',
      });
      accounts.create.mockRejectedValue(duplicateError);

      await expect(
        service.createAccount('tenant-1', { code: GlAccountCode.CASH_AND_BANK, name: 'Dup', type: 'ASSET' }, actor),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('renameAccount', () => {
    it('renames the account and records an audit entry', async () => {
      accounts.updateName.mockResolvedValue({
        id: 'acc-cash',
        code: GlAccountCode.CASH_AND_BANK,
        name: 'Operating Account',
      } as never);

      const result = await service.renameAccount('tenant-1', 'acc-cash', { name: 'Operating Account' }, actor);

      expect(accounts.updateName).toHaveBeenCalledWith('tenant-1', 'acc-cash', 'Operating Account');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', action: 'finance.account.renamed', resourceId: 'acc-cash' }),
      );
      expect(result.name).toBe('Operating Account');
    });

    it('translates a not-found id (P2025) into a NotFoundException', async () => {
      const notFoundError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2025',
        message: 'mock',
      });
      accounts.updateName.mockRejectedValue(notFoundError);

      await expect(
        service.renameAccount('tenant-1', 'missing-id', { name: 'New Name' }, actor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('voidEntry', () => {
    function makeManualEntry(overrides: Record<string, unknown> = {}) {
      return {
        id: 'entry-1',
        organizationId: 'org-1',
        currency: 'GHS',
        description: 'Office rent',
        sourceType: 'MANUAL',
        reversalOfId: null,
        voidedAt: null,
        lines: [
          {
            accountId: 'acc-payroll-exp',
            debit: new Prisma.Decimal(500),
            credit: new Prisma.Decimal(0),
            account: { code: GlAccountCode.PAYROLL_EXPENSE, name: 'Payroll Expense' },
          },
          {
            accountId: 'acc-cash',
            debit: new Prisma.Decimal(0),
            credit: new Prisma.Decimal(500),
            account: { code: GlAccountCode.CASH_AND_BANK, name: 'Cash and Bank' },
          },
        ],
        ...overrides,
      };
    }

    it('posts a balanced reversal (debit/credit swapped) and records an audit entry', async () => {
      journalEntries.findById.mockResolvedValue(makeManualEntry() as never);
      journalEntries.voidEntry.mockResolvedValue({
        id: 'reversal-1',
        organizationId: 'org-1',
        entryDate: new Date('2026-03-01'),
        description: 'Void: Office rent',
        currency: 'GHS',
        sourceType: 'MANUAL',
        sourceId: 'reversal-uuid',
        voidedAt: null,
        reversalOfId: 'entry-1',
        lines: [],
      } as never);

      const result = await service.voidEntry('tenant-1', 'entry-1', actor);

      expect(journalEntries.voidEntry).toHaveBeenCalledWith(
        'tenant-1',
        'entry-1',
        expect.objectContaining({
          organizationId: 'org-1',
          currency: 'GHS',
          sourceType: 'MANUAL',
          description: 'Void: Office rent',
          lines: [
            { accountId: 'acc-payroll-exp', debit: 0, credit: 500 },
            { accountId: 'acc-cash', debit: 500, credit: 0 },
          ],
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', action: 'finance.journal_entry.voided', resourceId: 'entry-1' }),
      );
      expect(result.id).toBe('reversal-1');
    });

    it('throws NotFoundException when the entry does not exist', async () => {
      journalEntries.findById.mockResolvedValue(null);

      await expect(service.voidEntry('tenant-1', 'missing-id', actor)).rejects.toThrow(NotFoundException);
    });

    it('rejects voiding an automatic posting', async () => {
      journalEntries.findById.mockResolvedValue(makeManualEntry({ sourceType: 'PAY_RUN_DISBURSED' }) as never);

      await expect(service.voidEntry('tenant-1', 'entry-1', actor)).rejects.toThrow(BadRequestException);
      expect(journalEntries.voidEntry).not.toHaveBeenCalled();
    });

    it('rejects voiding a reversal entry', async () => {
      journalEntries.findById.mockResolvedValue(makeManualEntry({ reversalOfId: 'original-1' }) as never);

      await expect(service.voidEntry('tenant-1', 'entry-1', actor)).rejects.toThrow(BadRequestException);
      expect(journalEntries.voidEntry).not.toHaveBeenCalled();
    });

    it('rejects voiding an already-voided entry', async () => {
      journalEntries.findById.mockResolvedValue(makeManualEntry({ voidedAt: new Date() }) as never);

      await expect(service.voidEntry('tenant-1', 'entry-1', actor)).rejects.toThrow(ConflictException);
      expect(journalEntries.voidEntry).not.toHaveBeenCalled();
    });

    it('translates a concurrent double-void (repository returns null) into a ConflictException', async () => {
      journalEntries.findById.mockResolvedValue(makeManualEntry() as never);
      journalEntries.voidEntry.mockResolvedValue(null);

      await expect(service.voidEntry('tenant-1', 'entry-1', actor)).rejects.toThrow(ConflictException);
    });

    it("rejects voiding an entry dated on or before the organization's closed-through date", async () => {
      journalEntries.findById.mockResolvedValue(
        makeManualEntry({ entryDate: new Date('2026-03-15') }) as never,
      );
      periodCloses.findByOrganization.mockResolvedValue({
        closedThrough: new Date('2026-03-31'),
      } as never);

      await expect(service.voidEntry('tenant-1', 'entry-1', actor)).rejects.toThrow(BadRequestException);
      expect(journalEntries.voidEntry).not.toHaveBeenCalled();
    });
  });

  describe('getPeriodClose', () => {
    it('returns a not-closed shape when no close has ever been set', async () => {
      const result = await service.getPeriodClose('tenant-1', 'org-1');

      expect(result).toEqual({ organizationId: 'org-1', closedThrough: null, closedAt: null, closedBy: null });
    });

    it('returns the current close details', async () => {
      periodCloses.findByOrganization.mockResolvedValue({
        closedThrough: new Date('2026-03-31'),
        closedAt: new Date('2026-04-01'),
        closedBy: 'user-1',
      } as never);

      const result = await service.getPeriodClose('tenant-1', 'org-1');

      expect(result).toEqual({
        organizationId: 'org-1',
        closedThrough: new Date('2026-03-31').toISOString(),
        closedAt: new Date('2026-04-01').toISOString(),
        closedBy: 'user-1',
      });
    });
  });

  describe('setPeriodClose', () => {
    it('closes the period and records an audit entry', async () => {
      periodCloses.upsert.mockResolvedValue({
        closedThrough: new Date('2026-03-31'),
        closedAt: new Date('2026-04-01'),
        closedBy: 'user-1',
      } as never);

      const result = await service.setPeriodClose(
        'tenant-1',
        { organizationId: 'org-1', closedThrough: '2026-03-31' },
        actor,
      );

      expect(periodCloses.upsert).toHaveBeenCalledWith('tenant-1', 'org-1', new Date('2026-03-31'), 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: 'tenant-1', action: 'finance.period_close.set', resourceId: 'org-1' }),
      );
      expect(result.closedThrough).toBe(new Date('2026-03-31').toISOString());
    });

    it('rejects moving the close date earlier than the current close', async () => {
      periodCloses.findByOrganization.mockResolvedValue({
        closedThrough: new Date('2026-03-31'),
      } as never);

      await expect(
        service.setPeriodClose('tenant-1', { organizationId: 'org-1', closedThrough: '2026-02-28' }, actor),
      ).rejects.toThrow(BadRequestException);
      expect(periodCloses.upsert).not.toHaveBeenCalled();
    });

    it('translates a foreign-key violation on organizationId into a NotFoundException', async () => {
      const fkError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2003',
        message: 'mock',
      });
      periodCloses.upsert.mockRejectedValue(fkError);

      await expect(
        service.setPeriodClose('tenant-1', { organizationId: 'missing-org', closedThrough: '2026-03-31' }, actor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setBudget', () => {
    const dto = { organizationId: 'org-1', accountId: 'acc-1', fiscalYear: 2026, currency: 'GHS', amount: 1000 };

    it('rejects when the account does not belong to this tenant', async () => {
      accounts.findById.mockResolvedValue(null);

      await expect(service.setBudget('tenant-1', dto, actor)).rejects.toThrow(NotFoundException);
      expect(budgets.upsert).not.toHaveBeenCalled();
    });

    it('upserts the budget and audits on success', async () => {
      accounts.findById.mockResolvedValue({ id: 'acc-1', code: '5900', name: 'General Expense', type: 'EXPENSE' } as never);
      budgets.upsert.mockResolvedValue({
        id: 'budget-1',
        organizationId: 'org-1',
        accountId: 'acc-1',
        account: { code: '5900', name: 'General Expense' },
        fiscalYear: 2026,
        currency: 'GHS',
        amount: { toString: () => '1000' },
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      } as never);

      const result = await service.setBudget('tenant-1', dto, actor);

      expect(budgets.upsert).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        accountId: 'acc-1',
        fiscalYear: 2026,
        currency: 'GHS',
        amount: 1000,
        updatedBy: 'user-1',
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.budget.set', resourceId: 'budget-1' }),
      );
      expect(result.accountCode).toBe('5900');
      expect(result.amount).toBe('1000');
    });

    it('translates a foreign-key violation on organizationId into a NotFoundException', async () => {
      accounts.findById.mockResolvedValue({ id: 'acc-1', code: '5900', name: 'General Expense', type: 'EXPENSE' } as never);
      const fkError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2003',
        message: 'mock',
      });
      budgets.upsert.mockRejectedValue(fkError);

      await expect(service.setBudget('tenant-1', { ...dto, organizationId: 'missing-org' }, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listBudgets', () => {
    it('lists budgets scoped to the tenant, organization, and fiscal year', async () => {
      budgets.list.mockResolvedValue([]);

      await service.listBudgets('tenant-1', 'org-1', 2026);

      expect(budgets.list).toHaveBeenCalledWith('tenant-1', { organizationId: 'org-1', fiscalYear: 2026 });
    });
  });

  describe('deleteBudget', () => {
    it('throws NotFoundException when the budget does not exist', async () => {
      budgets.findById.mockResolvedValue(null);

      await expect(service.deleteBudget('tenant-1', 'missing', actor)).rejects.toThrow(NotFoundException);
      expect(budgets.delete).not.toHaveBeenCalled();
    });

    it('deletes and audits on success', async () => {
      budgets.findById.mockResolvedValue({
        id: 'budget-1',
        organizationId: 'org-1',
        fiscalYear: 2026,
        account: { code: '5900' },
      } as never);

      await service.deleteBudget('tenant-1', 'budget-1', actor);

      expect(budgets.delete).toHaveBeenCalledWith('tenant-1', 'budget-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.budget.deleted', resourceId: 'budget-1' }),
      );
    });
  });

  describe('createReconciliation', () => {
    const dto = {
      organizationId: 'org-1',
      currency: 'GHS',
      statementDate: '2026-03-31',
      statementEndingBalance: 5000,
    };

    it('creates the reconciliation and audits on success', async () => {
      bankReconciliations.create.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        currency: 'GHS',
        statementDate: new Date('2026-03-31'),
        statementEndingBalance: { toString: () => '5000' },
        status: 'IN_PROGRESS',
        completedAt: null,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
      } as never);

      const result = await service.createReconciliation('tenant-1', dto, actor);

      expect(bankReconciliations.create).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        currency: 'GHS',
        statementDate: new Date('2026-03-31'),
        statementEndingBalance: 5000,
        createdBy: 'user-1',
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.bank_reconciliation.created', resourceId: 'rec-1' }),
      );
      expect(result.id).toBe('rec-1');
      expect(result.statementEndingBalance).toBe('5000');
    });

    it('translates a foreign-key violation on organizationId into a NotFoundException', async () => {
      const fkError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2003',
        message: 'mock',
      });
      bankReconciliations.create.mockRejectedValue(fkError);

      await expect(service.createReconciliation('tenant-1', { ...dto, organizationId: 'missing-org' }, actor)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listReconciliations', () => {
    it('lists reconciliations scoped to the tenant and organization', async () => {
      bankReconciliations.list.mockResolvedValue([]);

      await service.listReconciliations('tenant-1', 'org-1');

      expect(bankReconciliations.list).toHaveBeenCalledWith('tenant-1', 'org-1');
    });
  });

  describe('getReconciliationDetail', () => {
    it('throws NotFoundException when the reconciliation does not exist', async () => {
      bankReconciliations.findById.mockResolvedValue(null);

      await expect(service.getReconciliationDetail('tenant-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('computes the cleared balance, difference, and balanced flag from cleared lines only', async () => {
      bankReconciliations.findById.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        currency: 'GHS',
        statementDate: new Date('2026-03-31'),
        statementEndingBalance: { toString: () => '500' },
        status: 'IN_PROGRESS',
        completedAt: null,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
      } as never);
      journalEntries.listCashLinesForReconciliation.mockResolvedValue([
        {
          id: 'line-1',
          reconciliationId: 'rec-1',
          debit: new Prisma.Decimal(500),
          credit: new Prisma.Decimal(0),
          journalEntry: { entryDate: new Date('2026-03-15'), description: 'Customer payment' },
        },
        {
          id: 'line-2',
          reconciliationId: null,
          debit: new Prisma.Decimal(0),
          credit: new Prisma.Decimal(200),
          journalEntry: { entryDate: new Date('2026-03-20'), description: 'Bank fee' },
        },
      ] as never);

      const result = await service.getReconciliationDetail('tenant-1', 'rec-1');

      expect(result.lines).toHaveLength(2);
      expect(result.lines[0].cleared).toBe(true);
      expect(result.lines[1].cleared).toBe(false);
      expect(result.clearedBalance).toBe(500);
      expect(result.difference).toBe(0);
      expect(result.isBalanced).toBe(true);
    });
  });

  describe('toggleLine', () => {
    function makeReconciliation(overrides: Record<string, unknown> = {}) {
      return {
        id: 'rec-1',
        organizationId: 'org-1',
        currency: 'GHS',
        statementDate: new Date('2026-03-31'),
        statementEndingBalance: { toString: () => '500' },
        status: 'IN_PROGRESS',
        completedAt: null,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
        ...overrides,
      };
    }

    function makeLine(overrides: Record<string, unknown> = {}) {
      return {
        id: 'line-1',
        reconciliationId: null,
        debit: new Prisma.Decimal(500),
        credit: new Prisma.Decimal(0),
        account: { code: GlAccountCode.CASH_AND_BANK },
        journalEntry: { entryDate: new Date('2026-03-15'), description: 'Customer payment' },
        ...overrides,
      };
    }

    it('throws NotFoundException when the reconciliation does not exist', async () => {
      bankReconciliations.findById.mockResolvedValue(null);

      await expect(service.toggleLine('tenant-1', 'missing', 'line-1', actor)).rejects.toThrow(NotFoundException);
    });

    it('rejects toggling a line on an already-completed reconciliation', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation({ status: 'COMPLETED' }) as never);

      await expect(service.toggleLine('tenant-1', 'rec-1', 'line-1', actor)).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when the line does not exist', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation() as never);
      journalEntries.findLineById.mockResolvedValue(null);

      await expect(service.toggleLine('tenant-1', 'rec-1', 'missing-line', actor)).rejects.toThrow(NotFoundException);
    });

    it('rejects a non Cash and Bank line', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation() as never);
      journalEntries.findLineById.mockResolvedValue(
        makeLine({ account: { code: GlAccountCode.PAYROLL_EXPENSE } }) as never,
      );

      await expect(service.toggleLine('tenant-1', 'rec-1', 'line-1', actor)).rejects.toThrow(BadRequestException);
    });

    it('rejects a line already cleared in a different reconciliation', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation() as never);
      journalEntries.findLineById.mockResolvedValue(makeLine({ reconciliationId: 'other-rec' }) as never);

      await expect(service.toggleLine('tenant-1', 'rec-1', 'line-1', actor)).rejects.toThrow(ConflictException);
    });

    it('clears an unclaimed line', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation() as never);
      journalEntries.findLineById.mockResolvedValue(makeLine() as never);
      journalEntries.setLineReconciliation.mockResolvedValue(makeLine({ reconciliationId: 'rec-1' }) as never);

      const result = await service.toggleLine('tenant-1', 'rec-1', 'line-1', actor);

      expect(journalEntries.setLineReconciliation).toHaveBeenCalledWith('tenant-1', 'line-1', 'rec-1');
      expect(result.cleared).toBe(true);
    });

    it('unclears a line already cleared by this reconciliation', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation() as never);
      journalEntries.findLineById.mockResolvedValue(makeLine({ reconciliationId: 'rec-1' }) as never);
      journalEntries.setLineReconciliation.mockResolvedValue(makeLine({ reconciliationId: null }) as never);

      const result = await service.toggleLine('tenant-1', 'rec-1', 'line-1', actor);

      expect(journalEntries.setLineReconciliation).toHaveBeenCalledWith('tenant-1', 'line-1', null);
      expect(result.cleared).toBe(false);
    });
  });

  describe('completeReconciliation', () => {
    function makeReconciliation(overrides: Record<string, unknown> = {}) {
      return {
        id: 'rec-1',
        organizationId: 'org-1',
        currency: 'GHS',
        statementDate: new Date('2026-03-31'),
        statementEndingBalance: { toString: () => '500' },
        status: 'IN_PROGRESS',
        completedAt: null,
        createdAt: new Date('2026-04-01'),
        updatedAt: new Date('2026-04-01'),
        ...overrides,
      };
    }

    it('throws NotFoundException when the reconciliation does not exist', async () => {
      bankReconciliations.findById.mockResolvedValue(null);

      await expect(service.completeReconciliation('tenant-1', 'missing', actor)).rejects.toThrow(NotFoundException);
    });

    it('rejects completing an already-completed reconciliation', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation({ status: 'COMPLETED' }) as never);

      await expect(service.completeReconciliation('tenant-1', 'rec-1', actor)).rejects.toThrow(ConflictException);
    });

    it('rejects completing when the cleared balance does not match the statement', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation() as never);
      journalEntries.listClearedLines.mockResolvedValue([
        { debit: new Prisma.Decimal(400), credit: new Prisma.Decimal(0) },
      ] as never);

      await expect(service.completeReconciliation('tenant-1', 'rec-1', actor)).rejects.toThrow(BadRequestException);
      expect(bankReconciliations.updateStatus).not.toHaveBeenCalled();
    });

    it('completes and audits when the cleared balance matches the statement', async () => {
      bankReconciliations.findById.mockResolvedValue(makeReconciliation() as never);
      journalEntries.listClearedLines.mockResolvedValue([
        { debit: new Prisma.Decimal(500), credit: new Prisma.Decimal(0) },
      ] as never);
      bankReconciliations.updateStatus.mockResolvedValue(makeReconciliation({ status: 'COMPLETED' }) as never);

      const result = await service.completeReconciliation('tenant-1', 'rec-1', actor);

      expect(bankReconciliations.updateStatus).toHaveBeenCalledWith('tenant-1', 'rec-1', 'COMPLETED', {
        completedAt: expect.any(Date),
        updatedBy: 'user-1',
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.bank_reconciliation.completed', resourceId: 'rec-1' }),
      );
      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('deleteReconciliation', () => {
    it('throws NotFoundException when the reconciliation does not exist', async () => {
      bankReconciliations.findById.mockResolvedValue(null);

      await expect(service.deleteReconciliation('tenant-1', 'missing', actor)).rejects.toThrow(NotFoundException);
    });

    it('rejects deleting a completed reconciliation', async () => {
      bankReconciliations.findById.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        currency: 'GHS',
        status: 'COMPLETED',
      } as never);

      await expect(service.deleteReconciliation('tenant-1', 'rec-1', actor)).rejects.toThrow(BadRequestException);
      expect(journalEntries.releaseClearedLines).not.toHaveBeenCalled();
    });

    it('releases cleared lines, deletes, and audits on success', async () => {
      bankReconciliations.findById.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        currency: 'GHS',
        status: 'IN_PROGRESS',
      } as never);

      await service.deleteReconciliation('tenant-1', 'rec-1', actor);

      expect(journalEntries.releaseClearedLines).toHaveBeenCalledWith('tenant-1', 'rec-1');
      expect(bankReconciliations.delete).toHaveBeenCalledWith('tenant-1', 'rec-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.bank_reconciliation.deleted', resourceId: 'rec-1' }),
      );
    });
  });

  describe('createRecurringJournalEntry', () => {
    const dto = {
      organizationId: 'org-1',
      description: 'Monthly rent',
      currency: 'GHS',
      dayOfMonth: 5,
      startDate: '2026-04-01',
      lines: [
        { accountId: 'acc-rent', debit: 500 },
        { accountId: 'acc-cash', credit: 500 },
      ],
    };

    it('rejects an entry where debits and credits do not balance', async () => {
      const unbalanced = {
        ...dto,
        lines: [{ accountId: 'acc-rent', debit: 500 }, { accountId: 'acc-cash', credit: 400 }],
      };

      await expect(service.createRecurringJournalEntry('tenant-1', unbalanced, actor)).rejects.toThrow(
        BadRequestException,
      );
      expect(recurringEntries.create).not.toHaveBeenCalled();
    });

    it('rejects a line with both debit and credit set', async () => {
      const bothSet = {
        ...dto,
        lines: [
          { accountId: 'acc-rent', debit: 500, credit: 500 },
          { accountId: 'acc-cash', credit: 500 },
        ],
      };

      await expect(service.createRecurringJournalEntry('tenant-1', bothSet, actor)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when a line references an account that does not belong to this tenant', async () => {
      accounts.findById.mockResolvedValue(null);

      await expect(service.createRecurringJournalEntry('tenant-1', dto, actor)).rejects.toThrow(NotFoundException);
      expect(recurringEntries.create).not.toHaveBeenCalled();
    });

    it('creates the template, computing the first run date, and audits on success', async () => {
      accounts.findById.mockResolvedValue({ id: 'acc-1', code: '5100', name: 'Rent Expense', type: 'EXPENSE' } as never);
      recurringEntries.create.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        description: 'Monthly rent',
        currency: 'GHS',
        dayOfMonth: 5,
        startDate: new Date('2026-04-01'),
        endDate: null,
        nextRunDate: new Date('2026-04-05'),
        lastRunDate: null,
        isActive: true,
        lines: [
          { id: 'line-1', accountId: 'acc-rent', account: { code: '5100', name: 'Rent Expense' }, debit: { toString: () => '500' }, credit: { toString: () => '0' } },
          { id: 'line-2', accountId: 'acc-cash', account: { code: '1000', name: 'Cash and Bank' }, debit: { toString: () => '0' }, credit: { toString: () => '500' } },
        ],
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
      } as never);

      const result = await service.createRecurringJournalEntry('tenant-1', dto, actor);

      expect(recurringEntries.create).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        description: 'Monthly rent',
        currency: 'GHS',
        dayOfMonth: 5,
        startDate: new Date('2026-04-01'),
        endDate: undefined,
        nextRunDate: new Date('2026-04-05'),
        createdBy: 'user-1',
        lines: [
          { accountId: 'acc-rent', debit: 500, credit: 0 },
          { accountId: 'acc-cash', debit: 0, credit: 500 },
        ],
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.recurring_journal_entry.created', resourceId: 'rec-1' }),
      );
      expect(result.id).toBe('rec-1');
      expect(result.lines).toHaveLength(2);
    });

    it('translates a foreign-key violation on organizationId into a NotFoundException', async () => {
      accounts.findById.mockResolvedValue({ id: 'acc-1', code: '5100', name: 'Rent Expense', type: 'EXPENSE' } as never);
      const fkError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2003',
        message: 'mock',
      });
      recurringEntries.create.mockRejectedValue(fkError);

      await expect(
        service.createRecurringJournalEntry('tenant-1', { ...dto, organizationId: 'missing-org' }, actor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listRecurringJournalEntries', () => {
    it('lists templates scoped to the tenant and organization', async () => {
      recurringEntries.list.mockResolvedValue([]);

      await service.listRecurringJournalEntries('tenant-1', 'org-1');

      expect(recurringEntries.list).toHaveBeenCalledWith('tenant-1', 'org-1');
    });
  });

  describe('setRecurringJournalEntryActive', () => {
    it('throws NotFoundException when the template does not exist', async () => {
      recurringEntries.findById.mockResolvedValue(null);

      await expect(
        service.setRecurringJournalEntryActive('tenant-1', 'missing', { isActive: false }, actor),
      ).rejects.toThrow(NotFoundException);
      expect(recurringEntries.setActive).not.toHaveBeenCalled();
    });

    it('pauses the template and audits with the paused action', async () => {
      recurringEntries.findById.mockResolvedValue({ id: 'rec-1', organizationId: 'org-1' } as never);
      recurringEntries.setActive.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        description: 'Monthly rent',
        currency: 'GHS',
        dayOfMonth: 5,
        startDate: new Date('2026-04-01'),
        endDate: null,
        nextRunDate: new Date('2026-04-05'),
        lastRunDate: null,
        isActive: false,
        lines: [],
        createdAt: new Date('2026-03-01'),
        updatedAt: new Date('2026-03-01'),
      } as never);

      const result = await service.setRecurringJournalEntryActive('tenant-1', 'rec-1', { isActive: false }, actor);

      expect(recurringEntries.setActive).toHaveBeenCalledWith('tenant-1', 'rec-1', false, 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.recurring_journal_entry.paused', resourceId: 'rec-1' }),
      );
      expect(result.isActive).toBe(false);
    });
  });

  describe('deleteRecurringJournalEntry', () => {
    it('throws NotFoundException when the template does not exist', async () => {
      recurringEntries.findById.mockResolvedValue(null);

      await expect(service.deleteRecurringJournalEntry('tenant-1', 'missing', actor)).rejects.toThrow(
        NotFoundException,
      );
      expect(recurringEntries.delete).not.toHaveBeenCalled();
    });

    it('deletes and audits on success', async () => {
      recurringEntries.findById.mockResolvedValue({
        id: 'rec-1',
        organizationId: 'org-1',
        description: 'Monthly rent',
      } as never);

      await service.deleteRecurringJournalEntry('tenant-1', 'rec-1', actor);

      expect(recurringEntries.delete).toHaveBeenCalledWith('tenant-1', 'rec-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.recurring_journal_entry.deleted', resourceId: 'rec-1' }),
      );
    });
  });

  describe('getHomeCurrency', () => {
    it('returns a null currency when never set', async () => {
      const result = await service.getHomeCurrency('tenant-1', 'org-1');

      expect(result).toEqual({ organizationId: 'org-1', currency: null });
    });

    it('returns the set currency', async () => {
      homeCurrencies.findByOrganization.mockResolvedValue({ currency: 'GHS' } as never);

      const result = await service.getHomeCurrency('tenant-1', 'org-1');

      expect(result).toEqual({ organizationId: 'org-1', currency: 'GHS' });
    });
  });

  describe('setHomeCurrency', () => {
    it('upserts and audits on success', async () => {
      homeCurrencies.upsert.mockResolvedValue({ currency: 'GHS' } as never);

      const result = await service.setHomeCurrency('tenant-1', { organizationId: 'org-1', currency: 'GHS' }, actor);

      expect(homeCurrencies.upsert).toHaveBeenCalledWith('tenant-1', 'org-1', 'GHS', 'user-1');
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'finance.home_currency.set', resourceId: 'org-1' }),
      );
      expect(result).toEqual({ organizationId: 'org-1', currency: 'GHS' });
    });

    it('translates a foreign-key violation on organizationId into a NotFoundException', async () => {
      const fkError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2003',
        message: 'mock',
      });
      homeCurrencies.upsert.mockRejectedValue(fkError);

      await expect(
        service.setHomeCurrency('tenant-1', { organizationId: 'missing-org', currency: 'GHS' }, actor),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('runFxRevaluation', () => {
    const dto = { organizationId: 'org-1', currency: 'USD', asOfDate: '2026-03-31', rate: 11 };

    function makeLine(overrides: Record<string, unknown> = {}) {
      return {
        account: { code: GlAccountCode.CASH_AND_BANK },
        journalEntry: { currency: 'USD' },
        debit: 0,
        credit: 0,
        ...overrides,
      };
    }

    it('rejects when no home currency has been set', async () => {
      await expect(service.runFxRevaluation('tenant-1', dto, actor)).rejects.toThrow(BadRequestException);
      expect(journalEntries.listLinesUpTo).not.toHaveBeenCalled();
    });

    it('rejects revaluing the home currency against itself', async () => {
      homeCurrencies.findByOrganization.mockResolvedValue({ currency: 'USD' } as never);

      await expect(service.runFxRevaluation('tenant-1', dto, actor)).rejects.toThrow(BadRequestException);
    });

    it('rejects when a revaluation for this exact date already exists', async () => {
      homeCurrencies.findByOrganization.mockResolvedValue({ currency: 'GHS' } as never);
      fxRevaluations.findLatest.mockResolvedValue({ asOfDate: new Date('2026-03-31'), rate: 10 } as never);

      await expect(service.runFxRevaluation('tenant-1', dto, actor)).rejects.toThrow(ConflictException);
      expect(fxRevaluations.create).not.toHaveBeenCalled();
    });

    it('on the first ever revaluation, only establishes the baseline rate - no balance lookup, no posting', async () => {
      homeCurrencies.findByOrganization.mockResolvedValue({ currency: 'GHS' } as never);
      fxRevaluations.findLatest.mockResolvedValue(null);
      fxRevaluations.create.mockResolvedValue({
        id: 'rev-1',
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-03-31'),
        rate: { toString: () => '11' },
        previousRate: null,
        gainLoss: null,
        journalEntryId: null,
        createdAt: new Date('2026-03-31'),
      } as never);

      const result = await service.runFxRevaluation('tenant-1', dto, actor);

      expect(journalEntries.listLinesUpTo).not.toHaveBeenCalled();
      expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
      expect(fxRevaluations.create).toHaveBeenCalledWith('tenant-1', {
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-03-31'),
        rate: 11,
        previousRate: undefined,
        gainLoss: undefined,
        journalEntryId: undefined,
        createdBy: 'user-1',
      });
      expect(result.previousRate).toBeNull();
      expect(result.journalEntryId).toBeNull();
    });

    it('posts the adjusting entry and records the gain when the rate has moved and a balance exists', async () => {
      homeCurrencies.findByOrganization.mockResolvedValue({ currency: 'GHS' } as never);
      fxRevaluations.findLatest.mockResolvedValue({ asOfDate: new Date('2026-02-28'), rate: 10 } as never);
      journalEntries.listLinesUpTo.mockResolvedValue([makeLine({ debit: 1000 })] as never);
      journalEntries.createIfNotExists.mockResolvedValue({ id: 'entry-1' } as never);
      fxRevaluations.create.mockResolvedValue({
        id: 'rev-2',
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-03-31'),
        rate: { toString: () => '11' },
        previousRate: { toString: () => '10' },
        gainLoss: { toString: () => '1000' },
        journalEntryId: 'entry-1',
        createdAt: new Date('2026-03-31'),
      } as never);

      const result = await service.runFxRevaluation('tenant-1', dto, actor);

      expect(journalEntries.createIfNotExists).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({
          organizationId: 'org-1',
          entryDate: new Date('2026-03-31'),
          currency: 'GHS',
          sourceType: 'FX_REVALUATION',
          sourceId: 'org-1:USD:2026-03-31',
          lines: expect.arrayContaining([
            { accountId: 'acc-cash', debit: 1000, credit: 0 },
            { accountId: 'acc-fx-gain-loss', debit: 0, credit: 1000 },
          ]),
        }),
      );
      expect(fxRevaluations.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ previousRate: 10, gainLoss: 1000, journalEntryId: 'entry-1' }),
      );
      expect(result.gainLoss).toBe('1000');
    });

    it('records a zero gain and posts nothing when no monetary balance exists in this currency', async () => {
      homeCurrencies.findByOrganization.mockResolvedValue({ currency: 'GHS' } as never);
      fxRevaluations.findLatest.mockResolvedValue({ asOfDate: new Date('2026-02-28'), rate: 10 } as never);
      journalEntries.listLinesUpTo.mockResolvedValue([]);
      fxRevaluations.create.mockResolvedValue({
        id: 'rev-3',
        organizationId: 'org-1',
        currency: 'USD',
        asOfDate: new Date('2026-03-31'),
        rate: { toString: () => '11' },
        previousRate: { toString: () => '10' },
        gainLoss: { toString: () => '0' },
        journalEntryId: null,
        createdAt: new Date('2026-03-31'),
      } as never);

      await service.runFxRevaluation('tenant-1', dto, actor);

      expect(journalEntries.createIfNotExists).not.toHaveBeenCalled();
      expect(fxRevaluations.create).toHaveBeenCalledWith(
        'tenant-1',
        expect.objectContaining({ gainLoss: 0, journalEntryId: undefined }),
      );
    });

    it('translates a concurrent duplicate-date write (P2002) into a ConflictException', async () => {
      homeCurrencies.findByOrganization.mockResolvedValue({ currency: 'GHS' } as never);
      fxRevaluations.findLatest.mockResolvedValue(null);
      const duplicateError = Object.assign(Object.create(Prisma.PrismaClientKnownRequestError.prototype), {
        code: 'P2002',
        message: 'mock',
      });
      fxRevaluations.create.mockRejectedValue(duplicateError);

      await expect(service.runFxRevaluation('tenant-1', dto, actor)).rejects.toThrow(ConflictException);
    });
  });

  describe('listFxRevaluations', () => {
    it('lists revaluations scoped to the tenant and organization', async () => {
      fxRevaluations.list.mockResolvedValue([]);

      await service.listFxRevaluations('tenant-1', 'org-1');

      expect(fxRevaluations.list).toHaveBeenCalledWith('tenant-1', 'org-1');
    });
  });
});
