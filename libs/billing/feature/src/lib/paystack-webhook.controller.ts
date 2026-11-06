import { Controller, HttpCode, Param, Post, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { InvoiceService } from './invoice.service';

/**
 * Public, unauthenticated endpoint — Paystack calls this directly, not a
 * logged-in user, so it deliberately has no JwtAuthGuard/PermissionsGuard.
 * Authenticity is instead established by InvoiceService.handlePaystackWebhook
 * verifying the `x-paystack-signature` header against the raw request body.
 * Excluded from Swagger since it isn't part of the app's own API surface.
 *
 * One route per Paystack account/currency (see PaystackClientRegistry) -
 * each account has its own signing secret, so the handler needs to know
 * which one to verify against *before* it can trust the payload at all.
 * handleLegacy keeps the original currency-less URL working exactly as
 * before (defaulting to GHS), since that's what the live GHS Paystack
 * account already has registered in its dashboard - no need to touch
 * that registration just to add NGN/KES. A new account registers its own
 * `/webhooks/paystack/<currency>` URL in its own dashboard instead.
 */
@ApiExcludeController()
@Controller('webhooks/paystack')
export class PaystackWebhookController {
  constructor(private readonly invoices: InvoiceService) {}

  @Post()
  @HttpCode(200)
  handleLegacy(@Req() request: RawBodyRequest<Request>): Promise<{ received: true }> {
    return this.handle('GHS', request);
  }

  @Post(':currency')
  @HttpCode(200)
  async handle(
    @Param('currency') currency: string,
    @Req() request: RawBodyRequest<Request>,
  ): Promise<{ received: true }> {
    const rawBody = request.rawBody?.toString('utf8') ?? '';
    const signature = request.headers['x-paystack-signature'] as string | undefined;
    await this.invoices.handlePaystackWebhook(rawBody, signature, currency.toUpperCase());
    return { received: true };
  }
}
