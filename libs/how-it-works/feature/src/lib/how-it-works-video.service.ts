import { Injectable, NotFoundException } from '@nestjs/common';
import { HowItWorksVideo } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { RequestUser } from '@africahr/platform-auth';
import { CreateHowItWorksVideoDto } from './dto/create-how-it-works-video.dto';
import { UpdateHowItWorksVideoDto } from './dto/update-how-it-works-video.dto';

/**
 * Platform-root reference content (no tenant scoping) - deliberately simple,
 * no repository layer, direct PrismaService access, same precedent as
 * DemoRequestService for platform-root data with no complex business rules.
 */
@Injectable()
export class HowItWorksVideoService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<HowItWorksVideo[]> {
    return this.prisma.howItWorksVideo.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  create(dto: CreateHowItWorksVideoDto, actor: RequestUser): Promise<HowItWorksVideo> {
    return this.prisma.howItWorksVideo.create({
      data: {
        title: dto.title,
        description: dto.description,
        videoUrl: dto.videoUrl,
        category: dto.category,
        sortOrder: dto.sortOrder ?? 0,
        createdBy: actor.sub,
        updatedBy: actor.sub,
      },
    });
  }

  async update(id: string, dto: UpdateHowItWorksVideoDto, actor: RequestUser): Promise<HowItWorksVideo> {
    await this.findOrThrow(id);
    return this.prisma.howItWorksVideo.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        videoUrl: dto.videoUrl,
        category: dto.category,
        sortOrder: dto.sortOrder,
        updatedBy: actor.sub,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    await this.prisma.howItWorksVideo.delete({ where: { id } });
  }

  private async findOrThrow(id: string): Promise<HowItWorksVideo> {
    const video = await this.prisma.howItWorksVideo.findUnique({ where: { id } });
    if (!video) {
      throw new NotFoundException('Video not found');
    }
    return video;
  }
}
