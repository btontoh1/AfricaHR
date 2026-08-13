import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, Permission, PermissionsGuard, RequestUser, RequirePermissions } from '@africahr/platform-auth';
import { HowItWorksVideoService } from './how-it-works-video.service';
import { CreateHowItWorksVideoDto } from './dto/create-how-it-works-video.dto';
import { UpdateHowItWorksVideoDto } from './dto/update-how-it-works-video.dto';
import { HowItWorksVideoResponseDto } from './dto/how-it-works-video-response.dto';

// Read is open to every authenticated user regardless of role or tenant (no
// @RequirePermissions - same "any authenticated user" precedent as
// MyPasswordController), write is platform-admin only.
@ApiTags('how-it-works')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('how-it-works-videos')
export class HowItWorksVideoController {
  constructor(private readonly videos: HowItWorksVideoService) {}

  @Get()
  @ApiOperation({ summary: 'List tutorial videos, in display order' })
  @ApiOkResponse({ type: HowItWorksVideoResponseDto, isArray: true })
  list(): Promise<HowItWorksVideoResponseDto[]> {
    return this.videos.list();
  }

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.HOW_IT_WORKS_MANAGE)
  @ApiOperation({ summary: 'Add a tutorial video (platform admin only)' })
  create(
    @Body() dto: CreateHowItWorksVideoDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<HowItWorksVideoResponseDto> {
    return this.videos.create(dto, actor);
  }

  @Patch(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.HOW_IT_WORKS_MANAGE)
  @ApiOperation({ summary: 'Update a tutorial video (platform admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHowItWorksVideoDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<HowItWorksVideoResponseDto> {
    return this.videos.update(id, dto, actor);
  }

  @Delete(':id')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.HOW_IT_WORKS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a tutorial video (platform admin only)' })
  remove(@Param('id') id: string): Promise<void> {
    return this.videos.remove(id);
  }
}
