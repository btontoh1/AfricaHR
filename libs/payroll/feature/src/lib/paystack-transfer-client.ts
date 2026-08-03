import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { parseJsonResponse } from '@africahr/platform-core';

export interface CreateTransferRecipientInput {
  /** Paystack recipient type - see resolvePaystackRecipientType (payroll-domain), e.g. 'ghipss', 'nuban', 'mobile_money'. */
  type: string;
  name: string;
  accountNumber: string;
  bankCode: string;
  currency: string;
}

export interface CreateTransferRecipientResult {
  recipientCode: string;
}

export interface InitiateTransferInput {
  /** Major currency units (e.g. GHS, not pesewas) — converted to the smallest unit at the call site. */
  amount: number;
  currency: string;
  recipientCode: string;
  reference: string;
  reason?: string;
}

export interface InitiateTransferResult {
  transferCode: string;
  reference: string;
  status: string;
}

export interface VerifyTransferResult {
  /** Paystack's transfer status, e.g. 'success', 'failed', 'reversed', 'pending', 'otp'. */
  status: string;
}

/**
 * Abstract class (not an interface) so it doubles as a NestJS DI token —
 * same reasoning and shape as billing's PaystackClient/
 * NotificationDispatcher. Kept as a separate class from billing's
 * PaystackClient (transaction initialize, for collecting subscription
 * payments) rather than shared: scope:payroll cannot depend on
 * scope:billing (Nx module boundary), and Transfers is a distinct
 * Paystack API surface (recipients + payouts) from Transactions
 * (checkout). The module provides either LogPaystackTransferClient or
 * RealPaystackTransferClient depending on whether PAYSTACK_SECRET_KEY is
 * set (see PayrollFeatureModule) - same PAYSTACK_SECRET_KEY as billing,
 * since it's the same Paystack account, just a different API surface.
 */
@Injectable()
export abstract class PaystackTransferClient {
  abstract createRecipient(
    input: CreateTransferRecipientInput,
  ): Promise<CreateTransferRecipientResult>;

  abstract initiateTransfer(input: InitiateTransferInput): Promise<InitiateTransferResult>;

  /** Used by the disbursement reconciliation sweep to look up a transfer's current status directly, for when the transfer.success/transfer.failed webhook was never delivered (see PayrollTransferWebhookListener). */
  abstract verifyTransfer(reference: string): Promise<VerifyTransferResult>;
}

/**
 * PLACEHOLDER implementation — returns fake recipient/transfer codes and
 * never contacts Paystack or moves real money. Used when
 * PAYSTACK_SECRET_KEY is unset (local/dev/CI), same posture as billing's
 * LogPaystackClient.
 */
@Injectable()
export class LogPaystackTransferClient extends PaystackTransferClient {
  private readonly logger = new Logger(LogPaystackTransferClient.name);

  async createRecipient(
    input: CreateTransferRecipientInput,
  ): Promise<CreateTransferRecipientResult> {
    this.logger.log(
      `[PLACEHOLDER PAYSTACK RECIPIENT — no real provider configured] type=${input.type} name="${input.name}" accountNumber=${input.accountNumber}`,
    );
    return { recipientCode: `RCP_placeholder_${randomUUID()}` };
  }

  async initiateTransfer(input: InitiateTransferInput): Promise<InitiateTransferResult> {
    this.logger.log(
      `[PLACEHOLDER PAYSTACK TRANSFER — no real provider configured] recipient=${input.recipientCode} amount=${input.amount} ${input.currency} reference=${input.reference}`,
    );
    return { transferCode: `TRF_placeholder_${randomUUID()}`, reference: input.reference, status: 'pending' };
  }

  async verifyTransfer(reference: string): Promise<VerifyTransferResult> {
    this.logger.log(
      `[PLACEHOLDER PAYSTACK TRANSFER VERIFY — no real provider configured] reference=${reference}`,
    );
    // No real webhook ever arrives in placeholder mode, so a reconciliation
    // sweep would otherwise find these stuck PENDING forever - reporting
    // 'success' here lets the reconciliation flow still be exercised
    // end-to-end in dev/CI without a real Paystack account.
    return { status: 'success' };
  }
}

interface PaystackRecipientResponse {
  status: boolean;
  message: string;
  data: { recipient_code: string };
}

interface PaystackTransferResponse {
  status: boolean;
  message: string;
  data: { transfer_code: string; reference: string; status: string };
}

interface PaystackVerifyTransferResponse {
  status: boolean;
  message: string;
  data: { status: string };
}

/**
 * Real payroll disbursement via Paystack's Transfer Recipient + Initiate
 * Transfer REST endpoints. No SDK dependency: a plain fetch() against the
 * well-known, versioned REST endpoint, same approach as billing's
 * RealPaystackClient.
 */
@Injectable()
export class RealPaystackTransferClient extends PaystackTransferClient {
  private readonly logger = new Logger(RealPaystackTransferClient.name);
  private static readonly BASE_URL = 'https://api.paystack.co';

  constructor(private readonly secretKey: string) {
    super();
  }

  async createRecipient(
    input: CreateTransferRecipientInput,
  ): Promise<CreateTransferRecipientResult> {
    const response = await fetch(`${RealPaystackTransferClient.BASE_URL}/transferrecipient`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: input.type,
        name: input.name,
        account_number: input.accountNumber,
        bank_code: input.bankCode,
        currency: input.currency,
      }),
    });

    const body = await parseJsonResponse<PaystackRecipientResponse>(
      response,
      'Failed to create Paystack transfer recipient',
    );
    if (!response.ok || !body.status) {
      this.logger.error(`Paystack recipient creation failed: ${body.message ?? response.statusText}`);
      throw new Error(`Failed to create Paystack transfer recipient: ${body.message ?? response.statusText}`);
    }

    return { recipientCode: body.data.recipient_code };
  }

  async initiateTransfer(input: InitiateTransferInput): Promise<InitiateTransferResult> {
    const response = await fetch(`${RealPaystackTransferClient.BASE_URL}/transfer`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source: 'balance',
        // Paystack amounts are in the smallest currency unit (e.g. pesewas, kobo).
        amount: Math.round(input.amount * 100),
        currency: input.currency,
        recipient: input.recipientCode,
        reference: input.reference,
        reason: input.reason,
      }),
    });

    const body = await parseJsonResponse<PaystackTransferResponse>(
      response,
      'Failed to initiate Paystack transfer',
    );
    if (!response.ok || !body.status) {
      this.logger.error(`Paystack transfer initiation failed: ${body.message ?? response.statusText}`);
      throw new Error(`Failed to initiate Paystack transfer: ${body.message ?? response.statusText}`);
    }

    return {
      transferCode: body.data.transfer_code,
      reference: body.data.reference,
      status: body.data.status,
    };
  }

  async verifyTransfer(reference: string): Promise<VerifyTransferResult> {
    const response = await fetch(
      `${RealPaystackTransferClient.BASE_URL}/transfer/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${this.secretKey}` } },
    );

    const body = await parseJsonResponse<PaystackVerifyTransferResponse>(
      response,
      'Failed to verify Paystack transfer',
    );
    if (!response.ok || !body.status) {
      this.logger.error(`Paystack transfer verification failed: ${body.message ?? response.statusText}`);
      throw new Error(`Failed to verify Paystack transfer: ${body.message ?? response.statusText}`);
    }

    return { status: body.data.status };
  }
}
