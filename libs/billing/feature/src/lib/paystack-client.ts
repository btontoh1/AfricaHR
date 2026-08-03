import { Injectable, Logger } from '@nestjs/common';
import { createHmac, randomUUID } from 'node:crypto';
import { parseJsonResponse } from '@africahr/platform-core';

export interface InitializeTransactionInput {
  email: string;
  /** Major currency units (e.g. GHS, not pesewas) — converted to the smallest unit at the call site. */
  amount: number;
  currency: string;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface InitializeTransactionResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/**
 * Abstract class (not an interface) so it doubles as a NestJS DI token —
 * same reasoning and shape as NotificationDispatcher. The module provides
 * either LogPaystackClient or RealPaystackClient depending on whether
 * PAYSTACK_SECRET_KEY is set (see BillingFeatureModule).
 */
@Injectable()
export abstract class PaystackClient {
  abstract initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializeTransactionResult>;

  /** Verifies the `x-paystack-signature` header on an incoming webhook request against the raw request body. */
  abstract verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean;
}

/**
 * PLACEHOLDER implementation — returns a fake checkout URL and never
 * contacts Paystack. Used when PAYSTACK_SECRET_KEY is unset (local/dev/CI),
 * so those environments never need a real Paystack account to boot. Since
 * there is no real integration behind it, it also never validates a
 * webhook signature — there is no secret to verify against, and no real
 * webhook will ever be sent to a deployment running this placeholder.
 */
@Injectable()
export class LogPaystackClient extends PaystackClient {
  private readonly logger = new Logger(LogPaystackClient.name);

  async initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializeTransactionResult> {
    this.logger.log(
      `[PLACEHOLDER PAYSTACK CHECKOUT — no real provider configured] email=${input.email} amount=${input.amount} ${input.currency} reference=${input.reference}`,
    );
    return {
      authorizationUrl: `https://paystack.com/placeholder-checkout/${input.reference}`,
      accessCode: randomUUID(),
      reference: input.reference,
    };
  }

  // Parameters are intentionally unused - kept only so this still
  // type-checks as an override of PaystackClient's real signature.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    return false;
  }
}

interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

/**
 * Real payment collection via Paystack's "Initialize Transaction" REST
 * endpoint — deliberately not the newer Payment Request/Invoice API, whose
 * response shape is far less documented/stable. No SDK dependency: a plain
 * fetch() against the well-known, versioned REST endpoint.
 */
@Injectable()
export class RealPaystackClient extends PaystackClient {
  private readonly logger = new Logger(RealPaystackClient.name);
  private static readonly BASE_URL = 'https://api.paystack.co';

  constructor(private readonly secretKey: string) {
    super();
  }

  async initializeTransaction(
    input: InitializeTransactionInput,
  ): Promise<InitializeTransactionResult> {
    const response = await fetch(`${RealPaystackClient.BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        // Paystack amounts are in the smallest currency unit (e.g. pesewas, kobo).
        amount: Math.round(input.amount * 100),
        currency: input.currency,
        reference: input.reference,
        metadata: input.metadata,
      }),
    });

    const body = await parseJsonResponse<PaystackInitializeResponse>(
      response,
      'Failed to initialize Paystack transaction',
    );
    if (!response.ok || !body.status) {
      this.logger.error(`Paystack transaction initialize failed: ${body.message ?? response.statusText}`);
      throw new Error(`Failed to initialize Paystack transaction: ${body.message ?? response.statusText}`);
    }

    return {
      authorizationUrl: body.data.authorization_url,
      accessCode: body.data.access_code,
      reference: body.data.reference,
    };
  }

  /**
   * Paystack signs the raw request body with HMAC-SHA512 using the secret
   * key; the digest must match the `x-paystack-signature` header exactly.
   * Requires the *raw* (unparsed) body — see the dedicated Next.js webhook
   * proxy route, which forwards it untouched for this reason.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) {
      return false;
    }
    const expected = createHmac('sha512', this.secretKey).update(rawBody).digest('hex');
    return expected === signatureHeader;
  }
}
