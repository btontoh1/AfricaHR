import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { InvoiceService } from './invoice.service';

describe('PaystackWebhookController', () => {
  let controller: PaystackWebhookController;
  let service: jest.Mocked<InvoiceService>;

  beforeEach(() => {
    service = { handlePaystackWebhook: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<InvoiceService>;
    controller = new PaystackWebhookController(service);
  });

  it('forwards the raw body and signature header to InvoiceService', async () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'charge.success' }));
    const request = {
      rawBody,
      headers: { 'x-paystack-signature': 'sig-123' },
    } as unknown as RawBodyRequest<Request>;

    const result = await controller.handle(request);

    expect(service.handlePaystackWebhook).toHaveBeenCalledWith(rawBody.toString('utf8'), 'sig-123');
    expect(result).toEqual({ received: true });
  });

  it('passes an empty string when there is no raw body', async () => {
    const request = { headers: {} } as unknown as RawBodyRequest<Request>;

    await controller.handle(request);

    expect(service.handlePaystackWebhook).toHaveBeenCalledWith('', undefined);
  });
});
