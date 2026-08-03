import { Injectable, Logger } from '@nestjs/common';

export interface BankOption {
  name: string;
  code: string;
}

export interface ListBanksInput {
  /** Paystack's `country` query param, e.g. 'ghana', 'nigeria' - see resolvePaystackBankListParams (employee-domain). */
  country: string;
  /** Paystack's `type` query param, e.g. 'ghipss', 'mobile_money' - omitted for Nigeria, which needs no filter. */
  type?: string;
}

/**
 * Abstract class (not an interface) so it doubles as a NestJS DI token —
 * same reasoning and shape as billing's PaystackClient/payroll's
 * PaystackTransferClient. Kept as its own small class rather than shared
 * with either of those: scope:employee cannot depend on scope:billing or
 * scope:payroll (Nx module boundary), and "List Banks" is a third,
 * distinct Paystack API surface from Transactions/Transfers. The module
 * provides either LogPaystackBankClient or RealPaystackBankClient
 * depending on whether PAYSTACK_SECRET_KEY is set (see
 * EmployeeFeatureModule) - same PAYSTACK_SECRET_KEY as billing/payroll,
 * since it's the same Paystack account.
 */
@Injectable()
export abstract class PaystackBankClient {
  abstract listBanks(input: ListBanksInput): Promise<BankOption[]>;
}

/**
 * Illustrative fallback data only - a handful of well-known banks/mobile
 * money providers per country/type, not guaranteed to match Paystack's
 * real current codes. Used only when PAYSTACK_SECRET_KEY is unset
 * (local/dev/CI), so the payment-method form still has something to pick
 * from without a real Paystack account - and since RealPaystackTransferClient
 * (payroll) is equally a placeholder in that case, nothing ever actually
 * disburses against one of these codes for real.
 */
const FALLBACK_BANKS: Record<string, BankOption[]> = {
  'ghana:ghipss': [
    { name: 'GCB Bank', code: '040' },
    { name: 'Ecobank Ghana', code: '130' },
    { name: 'Stanbic Bank Ghana', code: '190' },
    { name: 'Fidelity Bank Ghana', code: '240' },
  ],
  'ghana:mobile_money': [
    { name: 'MTN Mobile Money', code: 'MTN' },
    { name: 'Vodafone Cash', code: 'VOD' },
    { name: 'AirtelTigo Money', code: 'ATL' },
  ],
  'nigeria:': [
    { name: 'Access Bank', code: '044' },
    { name: 'Guaranty Trust Bank', code: '058' },
    { name: 'Zenith Bank', code: '057' },
    { name: 'First Bank of Nigeria', code: '011' },
    { name: 'United Bank for Africa', code: '033' },
  ],
};

@Injectable()
export class LogPaystackBankClient extends PaystackBankClient {
  private readonly logger = new Logger(LogPaystackBankClient.name);

  async listBanks(input: ListBanksInput): Promise<BankOption[]> {
    this.logger.log(
      `[PLACEHOLDER PAYSTACK BANK LIST — no real provider configured] country=${input.country} type=${input.type ?? ''}`,
    );
    return FALLBACK_BANKS[`${input.country}:${input.type ?? ''}`] ?? [];
  }
}

interface PaystackBankListResponse {
  status: boolean;
  message: string;
  data: { name: string; code: string }[];
}

/**
 * Real bank/mobile-money-provider lookup via Paystack's "List Banks" REST
 * endpoint. Cached in-memory per (country, type) for an hour - this list
 * changes rarely, and there's no reason to round-trip to Paystack on
 * every employee who opens the payment-method form. Per-process cache
 * only (no Redis) - a stale entry for up to an hour across a multi-instance
 * deployment is an acceptable tradeoff for a list this stable.
 */
@Injectable()
export class RealPaystackBankClient extends PaystackBankClient {
  private readonly logger = new Logger(RealPaystackBankClient.name);
  private static readonly BASE_URL = 'https://api.paystack.co';
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000;
  private readonly cache = new Map<string, { expiresAt: number; banks: BankOption[] }>();

  constructor(private readonly secretKey: string) {
    super();
  }

  async listBanks(input: ListBanksInput): Promise<BankOption[]> {
    const cacheKey = `${input.country}:${input.type ?? ''}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.banks;
    }

    const params = new URLSearchParams({ country: input.country });
    if (input.type) {
      params.set('type', input.type);
    }

    const response = await fetch(`${RealPaystackBankClient.BASE_URL}/bank?${params.toString()}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });

    const body = (await response.json()) as PaystackBankListResponse;
    if (!response.ok || !body.status) {
      this.logger.error(`Paystack bank list fetch failed: ${body.message ?? response.statusText}`);
      throw new Error(`Failed to fetch Paystack bank list: ${body.message ?? response.statusText}`);
    }

    const banks = body.data.map((bank) => ({ name: bank.name, code: bank.code }));
    this.cache.set(cacheKey, { expiresAt: Date.now() + RealPaystackBankClient.CACHE_TTL_MS, banks });
    return banks;
  }
}
