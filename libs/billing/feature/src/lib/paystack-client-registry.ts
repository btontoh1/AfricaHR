import { Injectable } from '@nestjs/common';
import { LogPaystackClient, PaystackClient } from './paystack-client';

/**
 * One PaystackClient per Paystack account, keyed by that account's
 * settlement currency - see PAYSTACK_SECRET_KEY_GHS/NGN/KES's doc comment
 * (env.schema.ts) for why "the Paystack account for GHS" and "the
 * Paystack account for NGN" are genuinely different accounts/credentials,
 * never one multi-currency account. Built once at module init
 * (BillingFeatureModule) with one client per currency - Real when that
 * currency's secret key is configured, the same log-only placeholder as
 * the pre-multi-country single-account setup otherwise, so an
 * environment with only the legacy PAYSTACK_SECRET_KEY set behaves
 * exactly as before for every currency it already handled.
 */
@Injectable()
export class PaystackClientRegistry {
  private readonly fallback = new LogPaystackClient();

  constructor(
    private readonly clients: ReadonlyMap<string, PaystackClient>,
    private readonly configuredCurrencies: ReadonlySet<string>,
  ) {}

  forCurrency(currency: string): PaystackClient {
    return this.clients.get(currency) ?? this.fallback;
  }

  /**
   * Whether this currency has a real Paystack account configured - used
   * to give a tenant admin a clear, immediate error instead of a
   * silently fake checkout URL from the log placeholder (see
   * TenantPayrollWalletService.requestTopUp). Only meaningful to enforce
   * once hasAnyConfigured() is true - see that method's doc comment.
   */
  isConfigured(currency: string): boolean {
    return this.configuredCurrencies.has(currency);
  }

  /**
   * Whether ANY currency has a real Paystack account configured -
   * distinguishes "a real environment where GHS (say) is live and NGN
   * genuinely isn't configured yet" from "local/dev/CI, where nothing is
   * configured and every currency is expected to run against the log
   * placeholder". TenantPayrollWalletService.requestTopUp only blocks an
   * unconfigured currency once this is true, so dev/CI's existing
   * all-placeholder top-up flow keeps working exactly as before this
   * registry existed.
   */
  hasAnyConfigured(): boolean {
    return this.configuredCurrencies.size > 0;
  }
}
