import { randomUUID } from 'crypto';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { RequestUser } from '@africahr/platform-auth';
import {
  GlAccountRepository,
  GlJournalEntryRepository,
  GlJournalEntryWithLines,
} from '@africahr/finance-data-access';
import {
  computeInvoicePaidJournalLines,
  computeInvoiceSentJournalLines,
  computePayrollJournalLines,
  computeReversalJournalLines,
  isBalancedEntry,
  JournalLineAmount,
  PayRunPayrollTotals,
} from '@africahr/finance-domain';
import { CreateManualJournalEntryDto } from './dto/create-manual-journal-entry.dto';
import { CreateGlAccountDto } from './dto/create-gl-account.dto';
import { UpdateGlAccountDto } from './dto/update-gl-account.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { GlAccountResponseDto } from './dto/gl-account-response.dto';

function translateOrganizationReferenceError(error: unknown, organizationId: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
    throw new NotFoundException(`Organization "${organizationId}" not found`);
  }
  throw error;
}

function toAccountResponseDto(account: { id: string; code: string; name: string; type: string }): GlAccountResponseDto {
  return { id: account.id, code: account.code, name: account.name, type: account.type };
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

@Injectable()
export class FinanceService {
  constructor(
    private readonly accounts: GlAccountRepository,
    private readonly journalEntries: GlJournalEntryRepository,
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

  private async postLines(
    tenantId: string,
    input: {
      organizationId: string;
      entryDate: Date;
      description: string;
      currency: string;
      sourceType: 'PAY_RUN_DISBURSED' | 'CUSTOMER_INVOICE_SENT' | 'CUSTOMER_INVOICE_PAID';
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

    await this.accounts.ensureDefaultAccounts(tenantId);
    const accountIds = await this.accounts.mapCodesToIds(
      tenantId,
      dto.lines.map((line) => line.accountCode),
    );

    let entry: GlJournalEntryWithLines | null;
    try {
      entry = await this.journalEntries.createIfNotExists(tenantId, {
        organizationId: dto.organizationId,
        entryDate: new Date(dto.entryDate),
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
}
