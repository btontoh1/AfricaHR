import { randomUUID } from 'crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BankReconciliationStatus, GlPeriodClose, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser } from '@africahr/platform-auth';
import {
  BankReconciliationRepository,
  ExpenseRepository,
  GlAccountRepository,
  GlBudgetRepository,
  GlDepreciationRunRepository,
  GlFixedAssetRepository,
  GlFxRevaluationRepository,
  GlHomeCurrencyRepository,
  GlJournalEntryRepository,
  GlJournalEntryWithLines,
  GlJournalLineForReconciliation,
  GlJournalLineWithAccount,
  GlPeriodCloseRepository,
  GlRecurringJournalEntryRepository,
  GlRecurringJournalEntryWithLines,
} from '@africahr/finance-data-access';
import {
  canExtendPeriodClose,
  computeClearedBalance,
  computeDepreciationForPeriod,
  computeExpenseRecordedJournalLines,
  computeExpenseReimbursedJournalLines,
  computeFirstRunDate,
  computeFxRevaluationLines,
  computeInvoicePaidJournalLines,
  computeInvoiceSentJournalLines,
  computeNextRunDate,
  computePayrollJournalLines,
  computeRateDelta,
  computeReconciliationDifference,
  computeReversalJournalLines,
  computeVendorBillApprovedJournalLines,
  computeVendorPaymentJournalLines,
  depreciationDayOfMonth,
  GlAccountCode,
  isBalancedEntry,
  isDateWithinClosedPeriod,
  isFullyDepreciated,
  isReconciliationBalanced,
  JournalLineAmount,
  MonetaryAccountBalance,
  MONETARY_ACCOUNT_TYPES,
  PayRunPayrollTotals,
  roundCurrency,
} from '@africahr/finance-domain';
import { CreateManualJournalEntryDto } from './dto/create-manual-journal-entry.dto';
import { CreateGlAccountDto } from './dto/create-gl-account.dto';
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';
import { SetPeriodCloseDto } from './dto/set-period-close.dto';
import { SetBudgetDto } from './dto/set-budget.dto';
import { CreateBankReconciliationDto } from './dto/create-bank-reconciliation.dto';
import { CreateRecurringJournalEntryDto } from './dto/create-recurring-journal-entry.dto';
import { UpdateRecurringJournalEntryDto } from './dto/update-recurring-journal-entry.dto';
import { SetHomeCurrencyDto } from './dto/set-home-currency.dto';
import { RunFxRevaluationDto } from './dto/run-fx-revaluation.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { GlAccountResponseDto } from './dto/gl-account-response.dto';
import { BudgetResponseDto } from './dto/budget-response.dto';
import { PeriodCloseResponseDto } from './dto/period-close-response.dto';
import { BankReconciliationDetailResponseDto, BankReconciliationResponseDto } from './dto/bank-reconciliation-response.dto';
import { RecurringJournalEntryResponseDto } from './dto/recurring-journal-entry-response.dto';
import { HomeCurrencyResponseDto } from './dto/home-currency-response.dto';
import { FxRevaluationResponseDto } from './dto/fx-revaluation-response.dto';
import { CreateFixedAssetDto } from './dto/create-fixed-asset.dto';
import { DisposeFixedAssetDto } from './dto/dispose-fixed-asset.dto';
import { RunDepreciationDto } from './dto/run-depreciation.dto';
import { FixedAssetResponseDto } from './dto/fixed-asset-response.dto';
import { DepreciationRunResponseDto } from './dto/depreciation-run-response.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { ReimburseExpenseDto } from './dto/reimburse-expense.dto';
import { ExpenseResponseDto } from './dto/expense-response.dto';

function translateOrganizationReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Organization "${organizationId}" not found`);
  }
  throw error;
}

function toAccountResponseDto(account: { id: string; code: string; name: string; type: string }): GlAccountResponseDto {
  return { id: account.id, code: account.code, name: account.name, type: account.type };
}

function toPeriodCloseResponseDto(
  organizationId: string,
  close: { closedThrough: Date; closedAt: Date; closedBy: string | null } | null,
): PeriodCloseResponseDto {
  if (!close) {
    return { organizationId, closedThrough: null, closedAt: null, closedBy: null };
  }
  return {
    organizationId,
    closedThrough: close.closedThrough.toISOString(),
    closedAt: close.closedAt.toISOString(),
    closedBy: close.closedBy,
  };
}

function toBudgetResponseDto(budget: {
  id: string;
  organizationId: string;
  accountId: string;
  account: { code: string; name: string };
  fiscalYear: number;
  currency: string;
  amount: { toString(): string };
  createdAt: Date;
  updatedAt: Date;
}): BudgetResponseDto {
  return {
    id: budget.id,
    organizationId: budget.organizationId,
    accountId: budget.accountId,
    accountCode: budget.account.code,
    accountName: budget.account.name,
    fiscalYear: budget.fiscalYear,
    currency: budget.currency,
    amount: budget.amount.toString(),
    createdAt: budget.createdAt.toISOString(),
    updatedAt: budget.updatedAt.toISOString(),
  };
}

function toBankReconciliationResponseDto(reconciliation: {
  id: string;
  organizationId: string;
  currency: string;
  statementDate: Date;
  statementEndingBalance: { toString(): string };
  status: BankReconciliationStatus;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BankReconciliationResponseDto {
  return {
    id: reconciliation.id,
    organizationId: reconciliation.organizationId,
    currency: reconciliation.currency,
    statementDate: reconciliation.statementDate.toISOString(),
    statementEndingBalance: reconciliation.statementEndingBalance.toString(),
    status: reconciliation.status,
    completedAt: reconciliation.completedAt ? reconciliation.completedAt.toISOString() : null,
    createdAt: reconciliation.createdAt.toISOString(),
    updatedAt: reconciliation.updatedAt.toISOString(),
  };
}

function toBankReconciliationLineResponseDto(
  line: GlJournalLineForReconciliation,
  reconciliationId: string,
): BankReconciliationDetailResponseDto['lines'][number] {
  return {
    id: line.id,
    entryDate: line.journalEntry.entryDate.toISOString(),
    description: line.journalEntry.description,
    debit: line.debit.toString(),
    credit: line.credit.toString(),
    cleared: line.reconciliationId === reconciliationId,
  };
}

function toRecurringJournalEntryResponseDto(
  template: GlRecurringJournalEntryWithLines,
): RecurringJournalEntryResponseDto {
  return {
    id: template.id,
    organizationId: template.organizationId,
    description: template.description,
    currency: template.currency,
    dayOfMonth: template.dayOfMonth,
    startDate: template.startDate.toISOString(),
    endDate: template.endDate ? template.endDate.toISOString() : null,
    nextRunDate: template.nextRunDate.toISOString(),
    lastRunDate: template.lastRunDate ? template.lastRunDate.toISOString() : null,
    isActive: template.isActive,
    lines: template.lines.map((line) => ({
      id: line.id,
      accountId: line.accountId,
      accountCode: line.account.code,
      accountName: line.account.name,
      debit: line.debit.toString(),
      credit: line.credit.toString(),
    })),
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}

function toHomeCurrencyResponseDto(
  organizationId: string,
  homeCurrency: { currency: string } | null,
): HomeCurrencyResponseDto {
  return { organizationId, currency: homeCurrency?.currency ?? null };
}

function toFxRevaluationResponseDto(revaluation: {
  id: string;
  organizationId: string;
  currency: string;
  asOfDate: Date;
  rate: { toString(): string };
  previousRate: { toString(): string } | null;
  gainLoss: { toString(): string } | null;
  journalEntryId: string | null;
  createdAt: Date;
}): FxRevaluationResponseDto {
  return {
    id: revaluation.id,
    organizationId: revaluation.organizationId,
    currency: revaluation.currency,
    asOfDate: revaluation.asOfDate.toISOString(),
    rate: revaluation.rate.toString(),
    previousRate: revaluation.previousRate ? revaluation.previousRate.toString() : null,
    gainLoss: revaluation.gainLoss ? revaluation.gainLoss.toString() : null,
    journalEntryId: revaluation.journalEntryId,
    createdAt: revaluation.createdAt.toISOString(),
  };
}

function toFixedAssetResponseDto(asset: {
  id: string;
  organizationId: string;
  description: string;
  currency: string;
  cost: { toString(): string };
  salvageValue: { toString(): string };
  usefulLifeMonths: number;
  acquisitionDate: Date;
  status: string;
  accumulatedDepreciation: { toString(): string };
  nextDepreciationDate: Date | null;
  lastDepreciationDate: Date | null;
  disposedAt: Date | null;
  createdAt: Date;
}): FixedAssetResponseDto {
  const netBookValue = roundCurrency(Number(asset.cost) - Number(asset.accumulatedDepreciation));
  return {
    id: asset.id,
    organizationId: asset.organizationId,
    description: asset.description,
    currency: asset.currency,
    cost: asset.cost.toString(),
    salvageValue: asset.salvageValue.toString(),
    usefulLifeMonths: asset.usefulLifeMonths,
    acquisitionDate: asset.acquisitionDate.toISOString(),
    status: asset.status,
    accumulatedDepreciation: asset.accumulatedDepreciation.toString(),
    netBookValue: netBookValue.toString(),
    nextDepreciationDate: asset.nextDepreciationDate ? asset.nextDepreciationDate.toISOString() : null,
    lastDepreciationDate: asset.lastDepreciationDate ? asset.lastDepreciationDate.toISOString() : null,
    disposedAt: asset.disposedAt ? asset.disposedAt.toISOString() : null,
    createdAt: asset.createdAt.toISOString(),
  };
}

function toDepreciationRunResponseDto(run: {
  id: string;
  organizationId: string;
  currency: string;
  asOfDate: Date;
  totalDepreciation: { toString(): string };
  assetCount: number;
  journalEntryId: string | null;
  createdAt: Date;
}): DepreciationRunResponseDto {
  return {
    id: run.id,
    organizationId: run.organizationId,
    currency: run.currency,
    asOfDate: run.asOfDate.toISOString(),
    totalDepreciation: run.totalDepreciation.toString(),
    assetCount: run.assetCount,
    journalEntryId: run.journalEntryId,
    createdAt: run.createdAt.toISOString(),
  };
}

function toExpenseResponseDto(expense: {
  id: string;
  organizationId: string;
  description: string;
  category: string;
  currency: string;
  amount: { toString(): string };
  expenseDate: Date;
  paidBy: string;
  reimbursedAt: Date | null;
  notes: string | null;
  createdAt: Date;
}): ExpenseResponseDto {
  return {
    id: expense.id,
    organizationId: expense.organizationId,
    description: expense.description,
    category: expense.category,
    currency: expense.currency,
    amount: expense.amount.toString(),
    expenseDate: expense.expenseDate.toISOString(),
    paidBy: expense.paidBy,
    reimbursedAt: expense.reimbursedAt ? expense.reimbursedAt.toISOString() : null,
    notes: expense.notes,
    createdAt: expense.createdAt.toISOString(),
  };
}

function toJournalEntryResponseDto(entry: GlJournalEntryWithLines): JournalEntryResponseDto {
  return {
    id: entry.id,
    organizationId: entry.organizationId,
    entryDate: entry.entryDate.toISOString(),
    description: entry.description,
    currency: entry.currency,
    sourceType: entry.sourceType,
    sourceId: entry.sourceId,
    voidedAt: entry.voidedAt ? entry.voidedAt.toISOString() : null,
    reversalOfId: entry.reversalOfId,
    lines: entry.lines.map((line) => ({
      accountCode: line.account.code,
      accountName: line.account.name,
      debit: line.debit.toString(),
      credit: line.credit.toString(),
    })),
  };
}

export interface PayRunDisbursedForPosting {
  organizationId: string;
  payRunId: string;
  payDate: Date;
  currency: string;
  totals: PayRunPayrollTotals;
}

export interface CustomerInvoiceAmountsForPosting {
  organizationId: string;
  invoiceId: string;
  entryDate: Date;
  currency: string;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface VendorBillAmountsForPosting {
  organizationId: string;
  billId: string;
  entryDate: Date;
  currency: string;
  total: number;
}

export interface VendorPaymentAmountsForPosting {
  organizationId: string;
  paymentId: string;
  entryDate: Date;
  currency: string;
  amount: number;
}

@Injectable()
export class FinanceService {
  constructor(
    private readonly accounts: GlAccountRepository,
    private readonly journalEntries: GlJournalEntryRepository,
    private readonly periodCloses: GlPeriodCloseRepository,
    private readonly budgets: GlBudgetRepository,
    private readonly bankReconciliations: BankReconciliationRepository,
    private readonly recurringEntries: GlRecurringJournalEntryRepository,
    private readonly homeCurrencies: GlHomeCurrencyRepository,
    private readonly fxRevaluations: GlFxRevaluationRepository,
    private readonly fixedAssets: GlFixedAssetRepository,
    private readonly depreciationRuns: GlDepreciationRunRepository,
    private readonly expenses: ExpenseRepository,
    private readonly audit: AuditService,
  ) {}

  /**
   * Posts one balanced entry for an entire disbursed pay run - see
   * PayrollGlPostingListener for the event this is called from, and
   * finance-domain's computePayrollJournalLines for the balance proof.
   * Idempotent: a re-fired event for the same payRunId is a silent no-op
   * (see GlJournalEntryRepository.createIfNotExists).
   */
  async postPayrollDisbursement(tenantId: string, input: PayRunDisbursedForPosting): Promise<void> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = computePayrollJournalLines(input.totals);
    await this.postLines(tenantId, {
      organizationId: input.organizationId,
      entryDate: input.payDate,
      description: `Pay run disbursed (${input.payRunId})`,
      currency: input.currency,
      sourceType: 'PAY_RUN_DISBURSED',
      // Composite, not the bare payRunId - see the schema's own doc comment
      // on GlJournalEntrySourceType for why (a pay run's payslips are
      // grouped by currency upstream, one entry posted per group).
      sourceId: `${input.payRunId}:${input.currency}`,
      lines,
    });
  }

  async postInvoiceSent(tenantId: string, input: CustomerInvoiceAmountsForPosting): Promise<void> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = computeInvoiceSentJournalLines(input);
    await this.postLines(tenantId, {
      organizationId: input.organizationId,
      entryDate: input.entryDate,
      description: `Customer invoice sent (${input.invoiceId})`,
      currency: input.currency,
      sourceType: 'CUSTOMER_INVOICE_SENT',
      sourceId: input.invoiceId,
      lines,
    });
  }

  async postInvoicePaid(tenantId: string, input: CustomerInvoiceAmountsForPosting): Promise<void> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = computeInvoicePaidJournalLines(input);
    await this.postLines(tenantId, {
      organizationId: input.organizationId,
      entryDate: input.entryDate,
      description: `Customer invoice paid (${input.invoiceId})`,
      currency: input.currency,
      sourceType: 'CUSTOMER_INVOICE_PAID',
      sourceId: input.invoiceId,
      lines,
    });
  }

  async postVendorBillApproved(tenantId: string, input: VendorBillAmountsForPosting): Promise<void> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = computeVendorBillApprovedJournalLines(input);
    await this.postLines(tenantId, {
      organizationId: input.organizationId,
      entryDate: input.entryDate,
      description: `Vendor bill approved (${input.billId})`,
      currency: input.currency,
      sourceType: 'VENDOR_BILL_APPROVED',
      sourceId: input.billId,
      lines,
    });
  }

  /**
   * Posts Dr Accounts Payable / Cr Cash and Bank for one recorded
   * VendorPayment's combined amount - sourceId is the payment's own id, so
   * it can never double-post even if VendorPaymentService's event fired
   * twice. Never one entry per allocated bill - see
   * compute-vendor-bill-journal-lines.ts.
   */
  async postVendorPayment(tenantId: string, input: VendorPaymentAmountsForPosting): Promise<void> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const lines = computeVendorPaymentJournalLines(input);
    await this.postLines(tenantId, {
      organizationId: input.organizationId,
      entryDate: input.entryDate,
      description: `Vendor payment (${input.paymentId})`,
      currency: input.currency,
      sourceType: 'VENDOR_PAYMENT',
      sourceId: input.paymentId,
      lines,
    });
  }

  private async postLines(
    tenantId: string,
    input: {
      organizationId: string;
      entryDate: Date;
      description: string;
      currency: string;
      sourceType:
        | 'PAY_RUN_DISBURSED'
        | 'CUSTOMER_INVOICE_SENT'
        | 'CUSTOMER_INVOICE_PAID'
        | 'VENDOR_BILL_APPROVED'
        | 'VENDOR_PAYMENT'
        | 'EXPENSE_RECORDED'
        | 'EXPENSE_REIMBURSED';
      sourceId: string;
      lines: JournalLineAmount[];
    },
  ): Promise<void> {
    const accountIds = await this.accounts.mapCodesToIds(
      tenantId,
      input.lines.map((line) => line.accountCode),
    );
    await this.journalEntries.createIfNotExists(tenantId, {
      organizationId: input.organizationId,
      entryDate: input.entryDate,
      description: input.description,
      currency: input.currency,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      lines: input.lines.map((line) => ({
        accountId: accountIds.get(line.accountCode) as string,
        debit: line.debit,
        credit: line.credit,
      })),
    });
  }

  /**
   * Manual journal entry stub - a single debit/credit pair (or more lines),
   * rejected unless it balances. This is deliberately the only way to record
   * activity outside payroll/invoicing in v1 (no expense categories, no
   * approval flow) - see ProfitAndLossResponseDto's own caveat about what
   * the P&L can and can't reflect yet.
   */
  async createManualEntry(
    tenantId: string,
    dto: CreateManualJournalEntryDto,
    actor: RequestUser,
  ): Promise<JournalEntryResponseDto> {
    const lines = dto.lines.map((line) => ({ debit: line.debit ?? 0, credit: line.credit ?? 0 }));
    if (lines.some((line) => (line.debit > 0) === (line.credit > 0))) {
      throw new BadRequestException('Each journal line must have exactly one of debit/credit set, never both or neither');
    }
    if (!isBalancedEntry(lines)) {
      throw new BadRequestException('Journal entry does not balance - total debits must equal total credits');
    }

    const entryDate = new Date(dto.entryDate);
    const close = await this.periodCloses.findByOrganization(tenantId, dto.organizationId);
    if (isDateWithinClosedPeriod(entryDate, close?.closedThrough ?? null)) {
      throw new BadRequestException(
        `Cannot post to a closed period - this organization's books are closed through ${close?.closedThrough.toISOString().slice(0, 10)}`,
      );
    }

    await this.accounts.ensureDefaultAccounts(tenantId);
    const accountIds = await this.accounts.mapCodesToIds(
      tenantId,
      dto.lines.map((line) => line.accountCode),
    );

    let entry: GlJournalEntryWithLines | null;
    try {
      entry = await this.journalEntries.createIfNotExists(tenantId, {
        organizationId: dto.organizationId,
        entryDate,
        description: dto.description,
        currency: dto.currency,
        sourceType: 'MANUAL',
        sourceId: randomUUID(),
        createdBy: actor.sub,
        lines: dto.lines.map((line) => ({
          accountId: accountIds.get(line.accountCode) as string,
          debit: line.debit ?? 0,
          credit: line.credit ?? 0,
        })),
      });
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }
    // A fresh randomUUID() sourceId can never already exist, so this is
    // unreachable - narrows the type for the return below.
    if (!entry) {
      throw new Error('Manual journal entry unexpectedly collided with an existing source id');
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.journal_entry.created',
      resourceType: 'GlJournalEntry',
      resourceId: entry.id,
      metadata: { organizationId: dto.organizationId, sourceType: 'MANUAL' },
    });

    return toJournalEntryResponseDto(entry);
  }

  /**
   * Corrects a mistaken manual entry by posting its reversal (equal amounts,
   * debit/credit swapped) and marking the original voided - never by
   * deleting it, which would erase audit history. Restricted to MANUAL
   * entries: automatic postings are derived from a payroll/invoicing event
   * that already happened, so "fixing" them here would desync the GL from
   * the source record (the pay run would still say PAID) - the correct fix
   * for those is to correct the underlying payroll/invoice record, which
   * re-posts through the normal event flow. A reversal itself is also never
   * voidable, so this can't chain into repeated undo/redo.
   */
  async voidEntry(tenantId: string, id: string, actor: RequestUser): Promise<JournalEntryResponseDto> {
    const original = await this.journalEntries.findById(tenantId, id);
    if (!original) {
      throw new NotFoundException(`Journal entry "${id}" not found`);
    }
    if (original.sourceType !== 'MANUAL') {
      throw new BadRequestException(
        'Only manual journal entries can be voided - correct the underlying payroll or invoice record instead',
      );
    }
    if (original.reversalOfId) {
      throw new BadRequestException('A reversal cannot itself be voided - post a new manual entry instead');
    }
    if (original.voidedAt) {
      throw new ConflictException('This entry has already been voided');
    }
    const close = await this.periodCloses.findByOrganization(tenantId, original.organizationId);
    if (isDateWithinClosedPeriod(original.entryDate, close?.closedThrough ?? null)) {
      throw new BadRequestException(
        `Cannot void an entry in a closed period - this organization's books are closed through ${close?.closedThrough.toISOString().slice(0, 10)}. Post a new correcting entry in an open period instead.`,
      );
    }

    const reversalLines = computeReversalJournalLines(
      original.lines.map((line) => ({
        accountId: line.accountId,
        debit: Number(line.debit),
        credit: Number(line.credit),
      })),
    );

    const reversal = await this.journalEntries.voidEntry(tenantId, id, {
      organizationId: original.organizationId,
      entryDate: new Date(),
      description: `Void: ${original.description}`,
      currency: original.currency,
      sourceType: 'MANUAL',
      sourceId: randomUUID(),
      createdBy: actor.sub,
      lines: reversalLines,
    });
    if (!reversal) {
      throw new ConflictException('This entry has already been voided');
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.journal_entry.voided',
      resourceType: 'GlJournalEntry',
      resourceId: id,
      metadata: { reversalEntryId: reversal.id },
    });

    return toJournalEntryResponseDto(reversal);
  }

  async listAccounts(tenantId: string): Promise<GlAccountResponseDto[]> {
    await this.accounts.ensureDefaultAccounts(tenantId);
    const accounts = await this.accounts.listByTenant(tenantId);
    return accounts.map(toAccountResponseDto);
  }

  /**
   * Adds a tenant-defined account for use in manual journal entries - see
   * GlAccountRepository.create's own doc comment for why automatic posting
   * never targets one of these.
   */
  async createAccount(
    tenantId: string,
    dto: CreateGlAccountDto,
    actor: RequestUser,
  ): Promise<GlAccountResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);

    let account;
    try {
      account = await this.accounts.create(tenantId, dto);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Account code "${dto.code}" is already in use`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.account.created',
      resourceType: 'GlAccount',
      resourceId: account.id,
      metadata: { code: dto.code, name: dto.name, type: dto.type },
    });

    return toAccountResponseDto(account);
  }

  /**
   * The only edit an existing account supports - see GlAccountRepository.
   * updateName's own doc comment for why code/type stay fixed.
   */
  async renameAccount(
    tenantId: string,
    id: string,
    dto: UpdateGlAccountDto,
    actor: RequestUser,
  ): Promise<GlAccountResponseDto> {
    let account;
    try {
      account = await this.accounts.updateName(tenantId, id, dto.name);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Account "${id}" not found`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.account.renamed',
      resourceType: 'GlAccount',
      resourceId: id,
      metadata: { name: dto.name },
    });

    return toAccountResponseDto(account);
  }

  async listJournalEntries(tenantId: string, organizationId?: string): Promise<JournalEntryResponseDto[]> {
    const entries = await this.journalEntries.list(tenantId, organizationId);
    return entries.map(toJournalEntryResponseDto);
  }

  async getPeriodClose(tenantId: string, organizationId: string): Promise<PeriodCloseResponseDto> {
    const close = await this.periodCloses.findByOrganization(tenantId, organizationId);
    return toPeriodCloseResponseDto(organizationId, close);
  }

  /**
   * Locks manual journal entry posting/voiding on or before closedThrough
   * for this organization - see isDateWithinClosedPeriod's callers in
   * createManualEntry/voidEntry. Only ever moves forward (canExtendPeriodClose);
   * a closedThrough earlier than the current one is rejected outright rather
   * than silently reopening the period.
   */
  async setPeriodClose(
    tenantId: string,
    dto: SetPeriodCloseDto,
    actor: RequestUser,
  ): Promise<PeriodCloseResponseDto> {
    const existing = await this.periodCloses.findByOrganization(tenantId, dto.organizationId);
    const closedThrough = new Date(dto.closedThrough);
    if (!canExtendPeriodClose(existing?.closedThrough ?? null, closedThrough)) {
      throw new BadRequestException(
        `Cannot move the close date earlier than the current close (${existing?.closedThrough.toISOString().slice(0, 10)})`,
      );
    }

    let close: GlPeriodClose | undefined;
    try {
      close = await this.periodCloses.upsert(tenantId, dto.organizationId, closedThrough, actor.sub);
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }
    if (!close) {
      throw new Error('Period close upsert unexpectedly returned nothing');
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.period_close.set',
      resourceType: 'GlPeriodClose',
      resourceId: dto.organizationId,
      metadata: { closedThrough: dto.closedThrough },
    });

    return toPeriodCloseResponseDto(dto.organizationId, close);
  }

  /**
   * Sets or overwrites the budgeted amount for one account/organization/
   * fiscalYear/currency - see GlBudgetRepository.upsert's own doc comment
   * for why this is an overwrite, not a new row, when called again for the
   * same combination.
   */
  async setBudget(tenantId: string, dto: SetBudgetDto, actor: RequestUser): Promise<BudgetResponseDto> {
    const account = await this.accounts.findById(tenantId, dto.accountId);
    if (!account) {
      throw new NotFoundException(`Account "${dto.accountId}" not found`);
    }

    let budget;
    try {
      budget = await this.budgets.upsert(tenantId, {
        organizationId: dto.organizationId,
        accountId: dto.accountId,
        fiscalYear: dto.fiscalYear,
        currency: dto.currency,
        amount: dto.amount,
        updatedBy: actor.sub,
      });
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.budget.set',
      resourceType: 'GlBudget',
      resourceId: budget.id,
      metadata: {
        organizationId: dto.organizationId,
        accountCode: account.code,
        fiscalYear: dto.fiscalYear,
        currency: dto.currency,
        amount: dto.amount,
      },
    });

    return toBudgetResponseDto(budget);
  }

  async listBudgets(
    tenantId: string,
    organizationId: string | undefined,
    fiscalYear: number | undefined,
  ): Promise<BudgetResponseDto[]> {
    const budgets = await this.budgets.list(tenantId, { organizationId, fiscalYear });
    return budgets.map(toBudgetResponseDto);
  }

  async deleteBudget(tenantId: string, id: string, actor: RequestUser): Promise<void> {
    const budget = await this.budgets.findById(tenantId, id);
    if (!budget) {
      throw new NotFoundException(`Budget "${id}" not found`);
    }

    await this.budgets.delete(tenantId, id);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.budget.deleted',
      resourceType: 'GlBudget',
      resourceId: id,
      metadata: { organizationId: budget.organizationId, accountCode: budget.account.code, fiscalYear: budget.fiscalYear },
    });
  }

  async createReconciliation(
    tenantId: string,
    dto: CreateBankReconciliationDto,
    actor: RequestUser,
  ): Promise<BankReconciliationResponseDto> {
    let reconciliation;
    try {
      reconciliation = await this.bankReconciliations.create(tenantId, {
        organizationId: dto.organizationId,
        currency: dto.currency,
        statementDate: new Date(dto.statementDate),
        statementEndingBalance: dto.statementEndingBalance,
        createdBy: actor.sub,
      });
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.bank_reconciliation.created',
      resourceType: 'BankReconciliation',
      resourceId: reconciliation.id,
      metadata: { organizationId: dto.organizationId, currency: dto.currency, statementDate: dto.statementDate },
    });

    return toBankReconciliationResponseDto(reconciliation);
  }

  async listReconciliations(tenantId: string, organizationId?: string): Promise<BankReconciliationResponseDto[]> {
    const reconciliations = await this.bankReconciliations.list(tenantId, organizationId);
    return reconciliations.map(toBankReconciliationResponseDto);
  }

  /**
   * The candidate lines are every Cash and Bank line up to the statement
   * date that's unclaimed or already claimed by this reconciliation (see
   * GlJournalEntryRepository.listCashLinesForReconciliation) - not just the
   * ones currently cleared, so the person reconciling can see everything
   * they still need to decide on, not just their progress so far.
   */
  async getReconciliationDetail(tenantId: string, id: string): Promise<BankReconciliationDetailResponseDto> {
    const reconciliation = await this.findReconciliationOrThrow(tenantId, id);

    const lines = await this.journalEntries.listCashLinesForReconciliation(tenantId, {
      organizationId: reconciliation.organizationId,
      currency: reconciliation.currency,
      statementDate: reconciliation.statementDate,
      reconciliationId: id,
    });
    const clearedLines = lines.filter((line) => line.reconciliationId === id);
    const clearedBalance = computeClearedBalance(
      clearedLines.map((line) => ({ debit: Number(line.debit), credit: Number(line.credit) })),
    );
    const statementEndingBalance = Number(reconciliation.statementEndingBalance);

    return {
      ...toBankReconciliationResponseDto(reconciliation),
      lines: lines.map((line) => toBankReconciliationLineResponseDto(line, id)),
      clearedBalance,
      difference: computeReconciliationDifference(clearedBalance, statementEndingBalance),
      isBalanced: isReconciliationBalanced(clearedBalance, statementEndingBalance),
    };
  }

  /**
   * Toggles one line between cleared (claimed by this reconciliation) and
   * unclaimed - never lets a line already claimed by a *different*
   * reconciliation be touched (see GlJournalEntryRepository.
   * listCashLinesForReconciliation's own doc comment for why that can only
   * be an earlier, already-completed one), and never allows any change once
   * this reconciliation itself is COMPLETED.
   */
  async toggleLine(
    tenantId: string,
    reconciliationId: string,
    lineId: string,
    actor: RequestUser,
  ): Promise<BankReconciliationDetailResponseDto['lines'][number]> {
    const reconciliation = await this.findReconciliationOrThrow(tenantId, reconciliationId);
    if (reconciliation.status === BankReconciliationStatus.COMPLETED) {
      throw new BadRequestException('This reconciliation is already completed - it cannot be changed');
    }

    const line = await this.journalEntries.findLineById(tenantId, lineId);
    if (!line) {
      throw new NotFoundException(`Journal line "${lineId}" not found`);
    }
    if (line.account.code !== GlAccountCode.CASH_AND_BANK) {
      throw new BadRequestException('Only Cash and Bank lines can be cleared in a reconciliation');
    }
    if (line.reconciliationId && line.reconciliationId !== reconciliationId) {
      throw new ConflictException('This line is already cleared in a different reconciliation');
    }

    const nextReconciliationId = line.reconciliationId === reconciliationId ? null : reconciliationId;
    const updated = await this.journalEntries.setLineReconciliation(tenantId, lineId, nextReconciliationId);

    void actor;
    return toBankReconciliationLineResponseDto(updated, reconciliationId);
  }

  /**
   * Locks the reconciliation - only allowed once its cleared lines' net
   * balance exactly matches the statement's own ending balance (see
   * finance-domain's isReconciliationBalanced). One-way, same convention as
   * GlPeriodClose: no reopening in v1.
   */
  async completeReconciliation(tenantId: string, id: string, actor: RequestUser): Promise<BankReconciliationResponseDto> {
    const reconciliation = await this.findReconciliationOrThrow(tenantId, id);
    if (reconciliation.status === BankReconciliationStatus.COMPLETED) {
      throw new ConflictException('This reconciliation has already been completed');
    }

    const clearedLines = await this.journalEntries.listClearedLines(tenantId, id);
    const clearedBalance = computeClearedBalance(
      clearedLines.map((line) => ({ debit: Number(line.debit), credit: Number(line.credit) })),
    );
    const statementEndingBalance = Number(reconciliation.statementEndingBalance);
    if (!isReconciliationBalanced(clearedBalance, statementEndingBalance)) {
      throw new BadRequestException(
        `Cannot complete - the cleared balance (${clearedBalance}) does not match the statement ending balance (${statementEndingBalance})`,
      );
    }

    const completed = await this.bankReconciliations.updateStatus(tenantId, id, BankReconciliationStatus.COMPLETED, {
      completedAt: new Date(),
      updatedBy: actor.sub,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.bank_reconciliation.completed',
      resourceType: 'BankReconciliation',
      resourceId: id,
      metadata: { clearedBalance, statementEndingBalance },
    });

    return toBankReconciliationResponseDto(completed);
  }

  /**
   * Only an IN_PROGRESS reconciliation can be deleted - a COMPLETED one is
   * a locked historical record, same as a closed period. Releases every
   * line it had claimed back to unclaimed first, so they're eligible for a
   * future reconciliation again.
   */
  async deleteReconciliation(tenantId: string, id: string, actor: RequestUser): Promise<void> {
    const reconciliation = await this.findReconciliationOrThrow(tenantId, id);
    if (reconciliation.status === BankReconciliationStatus.COMPLETED) {
      throw new BadRequestException('A completed reconciliation cannot be deleted');
    }

    await this.journalEntries.releaseClearedLines(tenantId, id);
    await this.bankReconciliations.delete(tenantId, id);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.bank_reconciliation.deleted',
      resourceType: 'BankReconciliation',
      resourceId: id,
      metadata: { organizationId: reconciliation.organizationId, currency: reconciliation.currency },
    });
  }

  private async findReconciliationOrThrow(tenantId: string, id: string) {
    const reconciliation = await this.bankReconciliations.findById(tenantId, id);
    if (!reconciliation) {
      throw new NotFoundException(`Bank reconciliation "${id}" not found`);
    }
    return reconciliation;
  }

  /**
   * Creates a template that RecurringJournalEntryPoster's daily sweep posts
   * a real GlJournalEntry from every time it comes due - see the model's
   * own doc comment for why amounts/lines are never editable afterward.
   * Lines validate the same way as createManualEntry's (exactly one of
   * debit/credit per line, the whole entry balanced), but reference any of
   * the tenant's own accounts by id, not a fixed GlAccountCode - see
   * GlRecurringJournalEntryLine's own doc comment for why.
   */
  async createRecurringJournalEntry(
    tenantId: string,
    dto: CreateRecurringJournalEntryDto,
    actor: RequestUser,
  ): Promise<RecurringJournalEntryResponseDto> {
    const lines = dto.lines.map((line) => ({ debit: line.debit ?? 0, credit: line.credit ?? 0 }));
    if (lines.some((line) => (line.debit > 0) === (line.credit > 0))) {
      throw new BadRequestException('Each journal line must have exactly one of debit/credit set, never both or neither');
    }
    if (!isBalancedEntry(lines)) {
      throw new BadRequestException('Journal entry does not balance - total debits must equal total credits');
    }

    for (const line of dto.lines) {
      const account = await this.accounts.findById(tenantId, line.accountId);
      if (!account) {
        throw new NotFoundException(`Account "${line.accountId}" not found`);
      }
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    const nextRunDate = computeFirstRunDate(startDate, dto.dayOfMonth);

    let template;
    try {
      template = await this.recurringEntries.create(tenantId, {
        organizationId: dto.organizationId,
        description: dto.description,
        currency: dto.currency,
        dayOfMonth: dto.dayOfMonth,
        startDate,
        endDate,
        nextRunDate,
        createdBy: actor.sub,
        lines: dto.lines.map((line) => ({
          accountId: line.accountId,
          debit: line.debit ?? 0,
          credit: line.credit ?? 0,
        })),
      });
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.recurring_journal_entry.created',
      resourceType: 'GlRecurringJournalEntry',
      resourceId: template.id,
      metadata: { organizationId: dto.organizationId, dayOfMonth: dto.dayOfMonth, currency: dto.currency },
    });

    return toRecurringJournalEntryResponseDto(template);
  }

  async listRecurringJournalEntries(tenantId: string, organizationId?: string): Promise<RecurringJournalEntryResponseDto[]> {
    const templates = await this.recurringEntries.list(tenantId, organizationId);
    return templates.map(toRecurringJournalEntryResponseDto);
  }

  /** Pause/resume only - see GlRecurringJournalEntry's own doc comment. */
  async setRecurringJournalEntryActive(
    tenantId: string,
    id: string,
    dto: UpdateRecurringJournalEntryDto,
    actor: RequestUser,
  ): Promise<RecurringJournalEntryResponseDto> {
    const existing = await this.recurringEntries.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Recurring journal entry "${id}" not found`);
    }

    const updated = await this.recurringEntries.setActive(tenantId, id, dto.isActive, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: dto.isActive ? 'finance.recurring_journal_entry.resumed' : 'finance.recurring_journal_entry.paused',
      resourceType: 'GlRecurringJournalEntry',
      resourceId: id,
      metadata: { organizationId: existing.organizationId },
    });

    return toRecurringJournalEntryResponseDto(updated);
  }

  /** Deleting a template never touches any GlJournalEntry it already
   * posted - those stay in the ledger exactly as posted, same as deleting
   * a Budget never touches actuals already posted against that account. */
  async deleteRecurringJournalEntry(tenantId: string, id: string, actor: RequestUser): Promise<void> {
    const existing = await this.recurringEntries.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Recurring journal entry "${id}" not found`);
    }

    await this.recurringEntries.delete(tenantId, id);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.recurring_journal_entry.deleted',
      resourceType: 'GlRecurringJournalEntry',
      resourceId: id,
      metadata: { organizationId: existing.organizationId, description: existing.description },
    });
  }

  async getHomeCurrency(tenantId: string, organizationId: string): Promise<HomeCurrencyResponseDto> {
    const homeCurrency = await this.homeCurrencies.findByOrganization(tenantId, organizationId);
    return toHomeCurrencyResponseDto(organizationId, homeCurrency);
  }

  /** The currency every FX revaluation for this organization converts
   * foreign balances into - must be set before runFxRevaluation will do
   * anything for it. Setting it again overwrites it in place; changing an
   * established home currency doesn't retroactively touch revaluations
   * already posted under the old one. */
  async setHomeCurrency(tenantId: string, dto: SetHomeCurrencyDto, actor: RequestUser): Promise<HomeCurrencyResponseDto> {
    let homeCurrency;
    try {
      homeCurrency = await this.homeCurrencies.upsert(tenantId, dto.organizationId, dto.currency, actor.sub);
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.home_currency.set',
      resourceType: 'GlHomeCurrency',
      resourceId: dto.organizationId,
      metadata: { currency: dto.currency },
    });

    return toHomeCurrencyResponseDto(dto.organizationId, homeCurrency);
  }

  /**
   * Revalues every monetary (ASSET/LIABILITY) account's balance in
   * `dto.currency`, as of `dto.asOfDate`, against the organization's home
   * currency - see compute-fx-revaluation.ts for the balance-sheet-method
   * math and GlFxRevaluation's own doc comment for why the very first run
   * for an organization/currency only ever establishes a baseline rate.
   * Idempotent per (organization, currency, asOfDate) two ways: an
   * explicit check up front (for a clear error message) and the table's
   * own unique constraint as the concurrency backstop.
   */
  async runFxRevaluation(tenantId: string, dto: RunFxRevaluationDto, actor: RequestUser): Promise<FxRevaluationResponseDto> {
    const homeCurrency = await this.homeCurrencies.findByOrganization(tenantId, dto.organizationId);
    if (!homeCurrency) {
      throw new BadRequestException('Set a home currency for this organization before running an FX revaluation');
    }
    if (dto.currency === homeCurrency.currency) {
      throw new BadRequestException("Cannot revalue an organization's home currency against itself");
    }

    const asOfDate = new Date(dto.asOfDate);
    const previous = await this.fxRevaluations.findLatest(tenantId, dto.organizationId, dto.currency);
    if (previous && previous.asOfDate.getTime() === asOfDate.getTime()) {
      throw new ConflictException(`A revaluation for ${dto.currency} as of ${dto.asOfDate} has already been run`);
    }
    const previousRate = previous ? Number(previous.rate) : null;
    const rateDelta = computeRateDelta(dto.rate, previousRate);

    await this.accounts.ensureDefaultAccounts(tenantId);

    let journalEntryId: string | null = null;
    let gainLoss: number | null = null;

    if (rateDelta !== null) {
      const lines: GlJournalLineWithAccount[] = await this.journalEntries.listLinesUpTo(tenantId, {
        organizationId: dto.organizationId,
        asOf: asOfDate,
      });
      const relevantLines = lines.filter(
        (line) => line.journalEntry.currency === dto.currency && line.account.code in MONETARY_ACCOUNT_TYPES,
      );
      const balances: MonetaryAccountBalance[] = Object.entries(MONETARY_ACCOUNT_TYPES).map(
        ([accountCode, accountType]) => {
          const accountLines = relevantLines.filter((line) => line.account.code === accountCode);
          const balance = accountLines.reduce(
            (sum, line) =>
              sum +
              (accountType === 'ASSET'
                ? Number(line.debit) - Number(line.credit)
                : Number(line.credit) - Number(line.debit)),
            0,
          );
          return { accountCode: accountCode as GlAccountCode, balance };
        },
      );

      const { lines: journalLines, netGainLoss } = computeFxRevaluationLines(balances, rateDelta);
      gainLoss = netGainLoss;

      if (journalLines.length > 0) {
        const accountIds = await this.accounts.mapCodesToIds(
          tenantId,
          journalLines.map((line) => line.accountCode),
        );
        const entry = await this.journalEntries.createIfNotExists(tenantId, {
          organizationId: dto.organizationId,
          entryDate: asOfDate,
          description: `FX revaluation - ${dto.currency} at ${dto.rate}`,
          currency: homeCurrency.currency,
          sourceType: 'FX_REVALUATION',
          sourceId: `${dto.organizationId}:${dto.currency}:${dto.asOfDate}`,
          createdBy: actor.sub,
          lines: journalLines.map((line) => ({
            accountId: accountIds.get(line.accountCode) as string,
            debit: line.debit,
            credit: line.credit,
          })),
        });
        journalEntryId = entry ? entry.id : null;
      }
    }

    let revaluation;
    try {
      revaluation = await this.fxRevaluations.create(tenantId, {
        organizationId: dto.organizationId,
        currency: dto.currency,
        asOfDate,
        rate: dto.rate,
        previousRate: previousRate ?? undefined,
        gainLoss: gainLoss ?? undefined,
        journalEntryId: journalEntryId ?? undefined,
        createdBy: actor.sub,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`A revaluation for ${dto.currency} as of ${dto.asOfDate} has already been run`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.fx_revaluation.run',
      resourceType: 'GlFxRevaluation',
      resourceId: revaluation.id,
      metadata: { organizationId: dto.organizationId, currency: dto.currency, rate: dto.rate, gainLoss },
    });

    return toFxRevaluationResponseDto(revaluation);
  }

  async listFxRevaluations(tenantId: string, organizationId?: string): Promise<FxRevaluationResponseDto[]> {
    const revaluations = await this.fxRevaluations.list(tenantId, organizationId);
    return revaluations.map(toFxRevaluationResponseDto);
  }

  /**
   * Registers a fixed asset and immediately posts its acquisition entry (Dr
   * FIXED_ASSETS / Cr CASH_AND_BANK) - see default-chart-of-accounts.ts for
   * why every asset shares those two accounts rather than getting its own.
   * Idempotent by the asset's own id as sourceId, same shape as every other
   * one-shot automatic posting in this service.
   */
  async createFixedAsset(tenantId: string, dto: CreateFixedAssetDto, actor: RequestUser): Promise<FixedAssetResponseDto> {
    const salvageValue = dto.salvageValue ?? 0;
    if (salvageValue >= dto.cost) {
      throw new BadRequestException('salvageValue must be less than cost');
    }

    await this.accounts.ensureDefaultAccounts(tenantId);
    const accountIds = await this.accounts.mapCodesToIds(tenantId, [GlAccountCode.FIXED_ASSETS, GlAccountCode.CASH_AND_BANK]);

    const acquisitionDate = new Date(dto.acquisitionDate);
    let asset;
    try {
      asset = await this.fixedAssets.create(tenantId, {
        organizationId: dto.organizationId,
        description: dto.description,
        currency: dto.currency,
        cost: dto.cost,
        salvageValue,
        usefulLifeMonths: dto.usefulLifeMonths,
        acquisitionDate,
        nextDepreciationDate: computeFirstRunDate(acquisitionDate, depreciationDayOfMonth(acquisitionDate)),
        createdBy: actor.sub,
      });
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }

    await this.journalEntries.createIfNotExists(tenantId, {
      organizationId: dto.organizationId,
      entryDate: acquisitionDate,
      description: `Fixed asset acquired - ${dto.description}`,
      currency: dto.currency,
      sourceType: 'FIXED_ASSET_ACQUIRED',
      sourceId: asset.id,
      createdBy: actor.sub,
      lines: [
        { accountId: accountIds.get(GlAccountCode.FIXED_ASSETS) as string, debit: dto.cost, credit: 0 },
        { accountId: accountIds.get(GlAccountCode.CASH_AND_BANK) as string, debit: 0, credit: dto.cost },
      ],
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.fixed_asset.created',
      resourceType: 'GlFixedAsset',
      resourceId: asset.id,
      metadata: { organizationId: dto.organizationId, description: dto.description, cost: dto.cost, currency: dto.currency },
    });

    return toFixedAssetResponseDto(asset);
  }

  async listFixedAssets(tenantId: string, organizationId?: string): Promise<FixedAssetResponseDto[]> {
    const assets = await this.fixedAssets.list(tenantId, organizationId);
    return assets.map(toFixedAssetResponseDto);
  }

  /**
   * Retires an asset without posting a disposal gain/loss entry (a
   * deliberate v1 scope-cut - see GlFixedAssetRepository.dispose) and stops
   * it from ever being picked up by a future runDepreciation call. This is
   * the only way to retire an asset - see GlFixedAssetRepository's own doc
   * comment for why there is no delete.
   */
  async disposeFixedAsset(tenantId: string, id: string, dto: DisposeFixedAssetDto, actor: RequestUser): Promise<FixedAssetResponseDto> {
    const asset = await this.fixedAssets.findById(tenantId, id);
    if (!asset) {
      throw new NotFoundException(`Fixed asset "${id}" not found`);
    }
    if (asset.status === 'DISPOSED') {
      throw new ConflictException('This asset has already been disposed');
    }

    const disposedAt = dto.disposedAt ? new Date(dto.disposedAt) : new Date();
    await this.fixedAssets.dispose(tenantId, id, disposedAt, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.fixed_asset.disposed',
      resourceType: 'GlFixedAsset',
      resourceId: id,
      metadata: { organizationId: asset.organizationId },
    });

    const disposed = await this.fixedAssets.findById(tenantId, id);
    return toFixedAssetResponseDto(disposed as NonNullable<typeof disposed>);
  }

  /**
   * Depreciates every ACTIVE asset in (organizationId, currency) whose
   * schedule is due by asOfDate, posting one combined entry (Dr
   * DEPRECIATION_EXPENSE / Cr ACCUMULATED_DEPRECIATION) for the period's
   * total rather than one line per asset - same "one shared bucket"
   * convention as the accounts themselves. On-demand and idempotent per
   * (organization, currency, asOfDate), same shape as runFxRevaluation, not
   * a cron sweep. A run with nothing due still records a zero-asset
   * GlDepreciationRun row (no journal entry) so the history shows it ran
   * rather than looking like it silently failed.
   */
  async runDepreciation(tenantId: string, dto: RunDepreciationDto, actor: RequestUser): Promise<DepreciationRunResponseDto> {
    const asOfDate = new Date(dto.asOfDate);
    const existing = await this.depreciationRuns.findByDate(tenantId, dto.organizationId, dto.currency, asOfDate);
    if (existing) {
      throw new ConflictException(`Depreciation for ${dto.currency} as of ${dto.asOfDate} has already been run`);
    }

    await this.accounts.ensureDefaultAccounts(tenantId);
    const dueAssets = await this.fixedAssets.listDueForDepreciation(tenantId, dto.organizationId, dto.currency, asOfDate);

    const postings: { assetId: string; amount: number; periodDate: Date; acquisitionDate: Date; cost: number; salvageValue: number; newAccumulated: number }[] = [];
    let totalDepreciation = 0;
    for (const asset of dueAssets) {
      const amount = computeDepreciationForPeriod(
        Number(asset.cost),
        Number(asset.salvageValue),
        asset.usefulLifeMonths,
        Number(asset.accumulatedDepreciation),
      );
      if (amount <= 0) {
        continue;
      }
      totalDepreciation = roundCurrency(totalDepreciation + amount);
      postings.push({
        assetId: asset.id,
        amount,
        // nextDepreciationDate is guaranteed set - listDueForDepreciation only
        // ever returns ACTIVE assets, which always have one (see the model's
        // own doc comment).
        periodDate: asset.nextDepreciationDate as Date,
        acquisitionDate: asset.acquisitionDate,
        cost: Number(asset.cost),
        salvageValue: Number(asset.salvageValue),
        newAccumulated: roundCurrency(Number(asset.accumulatedDepreciation) + amount),
      });
    }

    let journalEntryId: string | null = null;
    if (postings.length > 0) {
      const accountIds = await this.accounts.mapCodesToIds(tenantId, [
        GlAccountCode.DEPRECIATION_EXPENSE,
        GlAccountCode.ACCUMULATED_DEPRECIATION,
      ]);
      const entry = await this.journalEntries.createIfNotExists(tenantId, {
        organizationId: dto.organizationId,
        entryDate: asOfDate,
        description: `Depreciation - ${dto.currency} as of ${dto.asOfDate}`,
        currency: dto.currency,
        sourceType: 'DEPRECIATION_RUN',
        sourceId: `${dto.organizationId}:${dto.currency}:${dto.asOfDate}`,
        createdBy: actor.sub,
        lines: [
          { accountId: accountIds.get(GlAccountCode.DEPRECIATION_EXPENSE) as string, debit: totalDepreciation, credit: 0 },
          { accountId: accountIds.get(GlAccountCode.ACCUMULATED_DEPRECIATION) as string, debit: 0, credit: totalDepreciation },
        ],
      });
      journalEntryId = entry ? entry.id : null;

      for (const posting of postings) {
        const fullyDepreciated = isFullyDepreciated(posting.cost, posting.salvageValue, posting.newAccumulated);
        await this.fixedAssets.updateAfterDepreciation(
          tenantId,
          posting.assetId,
          {
            accumulatedDepreciation: posting.newAccumulated,
            lastDepreciationDate: posting.periodDate,
            nextDepreciationDate: fullyDepreciated
              ? null
              : computeNextRunDate(posting.periodDate, depreciationDayOfMonth(posting.acquisitionDate)),
            status: fullyDepreciated ? 'FULLY_DEPRECIATED' : 'ACTIVE',
          },
          actor.sub,
        );
      }
    }

    let run;
    try {
      run = await this.depreciationRuns.create(tenantId, {
        organizationId: dto.organizationId,
        currency: dto.currency,
        asOfDate,
        totalDepreciation,
        assetCount: postings.length,
        journalEntryId: journalEntryId ?? undefined,
        createdBy: actor.sub,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Depreciation for ${dto.currency} as of ${dto.asOfDate} has already been run`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.depreciation.run',
      resourceType: 'GlDepreciationRun',
      resourceId: run.id,
      metadata: { organizationId: dto.organizationId, currency: dto.currency, totalDepreciation, assetCount: postings.length },
    });

    return toDepreciationRunResponseDto(run);
  }

  async listDepreciationRuns(tenantId: string, organizationId?: string): Promise<DepreciationRunResponseDto[]> {
    const runs = await this.depreciationRuns.list(tenantId, organizationId);
    return runs.map(toDepreciationRunResponseDto);
  }

  /**
   * Records a quick, single-step expense - no vendor, no DRAFT/approval
   * workflow, posts immediately. paidBy decides which account is credited:
   * COMPANY credits CASH_AND_BANK directly; EMPLOYEE credits
   * EXPENSE_REIMBURSEMENTS_PAYABLE instead, until markExpenseReimbursed
   * settles it. See compute-expense-journal-lines.ts.
   */
  async createExpense(tenantId: string, dto: CreateExpenseDto, actor: RequestUser): Promise<ExpenseResponseDto> {
    await this.accounts.ensureDefaultAccounts(tenantId);

    let expense;
    try {
      expense = await this.expenses.create(tenantId, {
        organizationId: dto.organizationId,
        description: dto.description,
        category: dto.category,
        currency: dto.currency,
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        paidBy: dto.paidBy,
        notes: dto.notes,
        createdBy: actor.sub,
      });
    } catch (error) {
      translateOrganizationReferenceError(error, dto.organizationId);
    }

    const lines = computeExpenseRecordedJournalLines({ amount: dto.amount, paidBy: dto.paidBy });
    await this.postLines(tenantId, {
      organizationId: dto.organizationId,
      entryDate: new Date(dto.expenseDate),
      description: `Expense recorded - ${dto.description}`,
      currency: dto.currency,
      sourceType: 'EXPENSE_RECORDED',
      sourceId: expense.id,
      lines,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.expense.created',
      resourceType: 'Expense',
      resourceId: expense.id,
      metadata: { organizationId: dto.organizationId, category: dto.category, amount: dto.amount, paidBy: dto.paidBy },
    });

    return toExpenseResponseDto(expense);
  }

  async listExpenses(tenantId: string, organizationId?: string): Promise<ExpenseResponseDto[]> {
    const expenses = await this.expenses.list(tenantId, organizationId);
    return expenses.map(toExpenseResponseDto);
  }

  /**
   * Settles an EMPLOYEE-paid expense the company has now paid back - posts
   * Dr Expense Reimbursements Payable / Cr Cash and Bank. Never valid for a
   * COMPANY-paid expense (nothing is owed) or one already reimbursed.
   */
  async markExpenseReimbursed(
    tenantId: string,
    id: string,
    dto: ReimburseExpenseDto,
    actor: RequestUser,
  ): Promise<ExpenseResponseDto> {
    const expense = await this.expenses.findById(tenantId, id);
    if (!expense) {
      throw new NotFoundException(`Expense "${id}" not found`);
    }
    if (expense.paidBy !== 'EMPLOYEE') {
      throw new BadRequestException('Only an employee-paid expense can be reimbursed');
    }
    if (expense.reimbursedAt) {
      throw new ConflictException('This expense has already been reimbursed');
    }

    await this.accounts.ensureDefaultAccounts(tenantId);
    const reimbursedAt = dto.reimbursedAt ? new Date(dto.reimbursedAt) : new Date();

    const lines = computeExpenseReimbursedJournalLines({ amount: Number(expense.amount) });
    await this.postLines(tenantId, {
      organizationId: expense.organizationId,
      entryDate: reimbursedAt,
      description: `Expense reimbursed - ${expense.description}`,
      currency: expense.currency,
      sourceType: 'EXPENSE_REIMBURSED',
      sourceId: expense.id,
      lines,
    });

    const updated = await this.expenses.markReimbursed(tenantId, id, reimbursedAt, actor.sub);

    await this.audit.record({
      tenantId,
      actorUserId: actor.sub ?? null,
      action: 'finance.expense.reimbursed',
      resourceType: 'Expense',
      resourceId: id,
      metadata: { organizationId: expense.organizationId },
    });

    return toExpenseResponseDto(updated);
  }
}
