import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthResponseDto } from '@africahr/iam-feature';
import { SetupService } from './setup.service';
import { SetupDto } from './dto/setup.dto';
import { SetupStatusResponseDto } from './dto/setup-status-response.dto';

@ApiTags('setup')
@Controller('setup')
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  @Get('status')
  @ApiOperation({ summary: 'Check whether the first-run setup wizard still needs to run' })
  @ApiOkResponse({ type: SetupStatusResponseDto })
  async status(): Promise<SetupStatusResponseDto> {
    return { needsSetup: await this.setup.needsSetup() };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create the first tenant and admin account (only while no tenant exists)' })
  @ApiOkResponse({ type: AuthResponseDto })
  bootstrap(@Body() dto: SetupDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.setup.bootstrap(dto, { userAgent: req.headers['user-agent'], ipAddress: req.ip });
  }
}
