import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PerformanceReviewCycle, PerformanceReviewCycleStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { PerformanceReviewCycleRepository } from '@africahr/performance-data-access';
import { CreateReviewCycleDto } from './dto/create-review-cycle.dto';
import { UpdateReviewCycleDto } from './dto/update-review-cycle.dto';

@Injectable()
export class ReviewCycleService {
  constructor(
    private readonly cycles: PerformanceReviewCycleRepository,
    private readonly audit: AuditService,
  ) {}

  async create(
    tenantId: string,
    dto: CreateReviewCycleDto,
    actorId?: string,
  ): Promise<PerformanceReviewCycle> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    let cycle: PerformanceReviewCycle;
    try {
      cycle = await this.cycles.create(tenantId, {
        name: dto.name,
        startDate,
        endDate,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Review cycle "${dto.name}" already exists`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.cycle.created',
      resourceType: 'PerformanceReviewCycle',
      resourceId: cycle.id,
    });

    return cycle;
  }

  async findById(tenantId: string, id: string): Promise<PerformanceReviewCycle> {
    const cycle = await this.cycles.findById(tenantId, id);
    if (!cycle) {
      throw new NotFoundException(`Review cycle "${id}" not found`);
    }
    return cycle;
  }

  list(
    tenantId: string,
    params: { status?: PerformanceReviewCycleStatus } = {},
  ): Promise<PerformanceReviewCycle[]> {
    return this.cycles.list(tenantId, params);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateReviewCycleDto,
    actorId?: string,
  ): Promise<PerformanceReviewCycle> {
    await this.findById(tenantId, id);

    const updated = await this.cycles.update(tenantId, id, {
      name: dto.name,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: dto.status,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.cycle.updated',
      resourceType: 'PerformanceReviewCycle',
      resourceId: id,
    });

    return updated;
  }
}
