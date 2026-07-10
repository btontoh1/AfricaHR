import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PerformanceGoal, PerformanceGoalStatus, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { PerformanceEmployeeRepository, PerformanceGoalRepository } from '@africahr/performance-data-access';
import { CreatePerformanceGoalDto } from './dto/create-performance-goal.dto';
import { UpdatePerformanceGoalDto } from './dto/update-performance-goal.dto';

@Injectable()
export class PerformanceGoalService {
  constructor(
    private readonly goals: PerformanceGoalRepository,
    private readonly employees: PerformanceEmployeeRepository,
    private readonly audit: AuditService,
  ) {}

  async resolveOwnEmployeeId(tenantId: string, userId: string): Promise<string> {
    const employee = await this.employees.findByUserId(tenantId, userId);
    if (!employee) {
      throw new ForbiddenException('No employee record is linked to this account');
    }
    return employee.id;
  }

  async createForSelf(
    tenantId: string,
    userId: string,
    dto: CreatePerformanceGoalDto,
  ): Promise<PerformanceGoal> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.create(tenantId, employeeId, dto, userId);
  }

  async create(
    tenantId: string,
    employeeId: string,
    dto: CreatePerformanceGoalDto,
    actorId?: string,
  ): Promise<PerformanceGoal> {
    let goal: PerformanceGoal;
    try {
      goal = await this.goals.create(tenantId, {
        employeeId,
        title: dto.title,
        description: dto.description,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException(`Employee "${employeeId}" not found`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.goal.created',
      resourceType: 'PerformanceGoal',
      resourceId: goal.id,
    });

    return goal;
  }

  async findById(tenantId: string, id: string): Promise<PerformanceGoal> {
    const goal = await this.goals.findById(tenantId, id);
    if (!goal) {
      throw new NotFoundException(`Performance goal "${id}" not found`);
    }
    return goal;
  }

  list(
    tenantId: string,
    params: { employeeId?: string; status?: PerformanceGoalStatus } = {},
  ): Promise<PerformanceGoal[]> {
    return this.goals.list(tenantId, params);
  }

  async listForSelf(tenantId: string, userId: string): Promise<PerformanceGoal[]> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    return this.goals.list(tenantId, { employeeId });
  }

  async updateForSelf(
    tenantId: string,
    userId: string,
    id: string,
    dto: UpdatePerformanceGoalDto,
  ): Promise<PerformanceGoal> {
    const employeeId = await this.resolveOwnEmployeeId(tenantId, userId);
    const goal = await this.findById(tenantId, id);
    if (goal.employeeId !== employeeId) {
      // Don't reveal that a goal belonging to someone else exists.
      throw new NotFoundException(`Performance goal "${id}" not found`);
    }
    return this.update(tenantId, id, dto, userId);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdatePerformanceGoalDto,
    actorId?: string,
  ): Promise<PerformanceGoal> {
    await this.findById(tenantId, id);

    const updated = await this.goals.update(tenantId, id, {
      title: dto.title,
      description: dto.description,
      targetDate: dto.targetDate !== undefined ? (dto.targetDate ? new Date(dto.targetDate) : null) : undefined,
      status: dto.status,
      progressPercent: dto.progressPercent,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'performance.goal.updated',
      resourceType: 'PerformanceGoal',
      resourceId: id,
    });

    return updated;
  }
}
