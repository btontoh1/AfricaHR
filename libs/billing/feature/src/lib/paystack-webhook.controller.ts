import { Controller, HttpCode, Post, Req } from '@nestjs/common';
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
 */
@ApiExcludeController()
@Controller('webhooks/paystack')
export class PaystackWebhookController {
  constructor(private readonly invoices: InvoiceService) {}

  @Post()
  @HttpCode(200)
  async handle(@Req() request: RawBodyRequest<Request>): Promise<{ received: true }> {
    const rawBody = request.rawBody?.toString('utf8') ?? '';
    const signature = request.headers['x-paystack-signature'] as string | undefined;
    await this.invoices.handlePaystackWebhook(rawBody, signature);
    return { received: true };
  }
}
