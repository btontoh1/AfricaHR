import { Injectable } from '@nestjs/common';
import { LogPaystackTransferClient, PaystackTransferClient } from './paystack-transfer-client';

/**
 * One PaystackTransferClient per Paystack account, keyed by that
 * account's settlement currency - mirrors billing-feature's
 * PaystackClientRegistry (kept as a separate class, not shared: scope:payroll
 * cannot depend on scope:billing - Nx module boundary). Built once at
 * module init (PayrollFeatureModule) with one client per currency - Real
 * when that currency's secret key is configured
 * (AppConfigService.paystackSecretKeysByCurrency), the same log-only
 * placeholder as the pre-multi-country single-account setup otherwise.
 */
@Injectable()
export class PaystackTransferClientRegistry {
  private readonly fallback = new LogPaystackTransferClient();

  constructor(private readonly clients: ReadonlyMap<string, PaystackTransferClient>) {}

  forCurrency(currency: string): PaystackTransferClient {
    return this.clients.get(currency) ?? this.fallback;
  }
}
