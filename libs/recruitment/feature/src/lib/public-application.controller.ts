import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PublicApplicationService } from './public-application.service';
import { SubmitPublicApplicationDto } from './dto/submit-public-application.dto';
import { PublicJobRequisitionResponseDto } from './dto/public-job-requisition-response.dto';
import { PublicApplicationResponseDto } from './dto/public-application-response.dto';

/**
 * Public, unauthenticated — a candidate reaches this from a link a company
 * embeds on its own website (see PublicApplicationService's doc comment),
 * not from a logged-in session, so it deliberately carries no
 * JwtAuthGuard/PermissionsGuard/:tenantId param, same posture as
 * SetupController. Throttled tighter than the app-wide default (100/60s,
 * see core.module.ts) since this is form-spam's most obvious target.
 */
@ApiTags('recruitment-public')
@Controller('public/job-requisitions')
export class PublicApplicationController {
  constructor(private readonly publicApplications: PublicApplicationService) {}

  @Get(':id')
  @ApiOperation({ summary: "Get an open job posting's public details, for a company's careers page" })
  @ApiOkResponse({ type: PublicJobRequisitionResponseDto })
  getOpenRequisition(@Param('id') id: string): Promise<PublicJobRequisitionResponseDto> {
    return this.publicApplications.getOpenRequisition(id);
  }

  @Post(':id/apply')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Submit a job application from a public careers page' })
  @ApiOkResponse({ type: PublicApplicationResponseDto })
  apply(
    @Param('id') id: string,
    @Body() dto: SubmitPublicApplicationDto,
  ): Promise<PublicApplicationResponseDto> {
    return this.publicApplications.apply(id, dto);
  }
}
