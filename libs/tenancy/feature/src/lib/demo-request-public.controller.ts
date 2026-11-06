import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { DemoRequestService } from './demo-request.service';
import { SubmitDemoRequestDto } from './dto/submit-demo-request.dto';
import { DemoRequestResponseDto } from './dto/demo-request-response.dto';

/**
 * Public, unauthenticated — the "Book a demo" form on the marketing
 * landing page (apps/web/src/features/marketing), reached by visitors with
 * no account yet. Same no-guard, tightly-throttled posture as
 * PublicApplicationController.
 */
@ApiTags('demo-requests')
@Controller('public/demo-requests')
export class DemoRequestPublicController {
  constructor(private readonly demoRequests: DemoRequestService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Submit a "Book a demo" request from the public marketing site' })
  @ApiOkResponse({ type: DemoRequestResponseDto })
  async submit(@Body() dto: SubmitDemoRequestDto): Promise<DemoRequestResponseDto> {
    const demoRequest = await this.demoRequests.submit(dto);
    return { id: demoRequest.id, createdAt: demoRequest.createdAt };
  }
}
