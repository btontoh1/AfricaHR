import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser, SystemRole } from '@africahr/platform-auth';
import { GlAccountRepository, GlJournalEntryRepository, GlPeriodCloseRepository } from '@africahr/finance-data-access';
import { GlAccountCode } from '@africahr/finance-domain';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let accounts: jest.Mocked<GlAccountRepository>;
  let journalEntries: jest.Mocked<GlJournalEntryRepository>;
  let periodCloses: jest.Mocked<GlPeriodCloseRepository>;
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
    [GlAccountCode.REVENUE, 'acc-revenue'],
    [GlAccountCode.PAYROLL_EXPENSE, 'acc-payroll-exp'],
  ]);

  beforeEach(() => {
    accounts = {
      ensureDefaultAccounts: jest.fn().mockResolvedValue(undefined),
      listByTenant: jest.fn(),
      mapCodesToIds: jest.fn().mockResolvedValue(accountIdByCode),
      updateName: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<GlAccountRepository>;

    journalEntries = {
      createIfNotExists: jest.fn(),
      list: jest.fn(),
      listLinesInRange: jest.fn(),
      findById: jest.fn(),
      voidEntry: jest.fn(),
    } as unknown as jest.Mocked<GlJournalEntryRepository>;

    periodCloses = {
      findByOrganization: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<GlPeriodCloseRepository>;

    audit = { record: jest.fn() } as unknown as jest.Mocked<AuditService>;

    service = new FinanceService(accounts, journalEntries, periodCloses, audit);
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
});
