import { Injectable } from '@nestjs/common';
import { DemoRequest } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';
import { SubmitDemoRequestDto } from './dto/submit-demo-request.dto';

const RECENT_DEMO_REQUESTS_LIMIT = 200;

/**
 * Backs the public "Book a demo" form on the marketing landing page.
 * Deliberately simple (no repository layer, no status workflow) — this is
 * a lead capture form, not a domain entity with business rules; direct
 * PrismaService access matches PlatformDashboardService's precedent for
 * platform-root reads that don't need one.
 */
@Injectable()
export class DemoRequestService {
  constructor(private readonly prisma: PrismaService) {}

  submit(dto: SubmitDemoRequestDto): Promise<DemoRequest> {
    return this.prisma.demoRequest.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        isWhatsapp: dto.isWhatsapp ?? false,
        organizationName: dto.organizationName,
        numberOfEmployees: dto.numberOfEmployees,
        preferredDate: dto.preferredDate,
        preferredTime: dto.preferredTime,
      },
    });
  }

  listRecent(): Promise<DemoRequest[]> {
    return this.prisma.demoRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: RECENT_DEMO_REQUESTS_LIMIT,
    });
  }

  async markAllViewed(): Promise<void> {
    await this.prisma.demoRequest.updateMany({
      where: { viewedAt: null },
      data: { viewedAt: new Date() },
    });
  }
}
