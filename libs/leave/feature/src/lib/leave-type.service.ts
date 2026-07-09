import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { LeaveType, Prisma } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { LeaveTypeRepository } from '@africahr/leave-data-access';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypeService {
  constructor(
    private readonly leaveTypes: LeaveTypeRepository,
    private readonly audit: AuditService,
  ) {}

  async create(tenantId: string, dto: CreateLeaveTypeDto, actorId?: string): Promise<LeaveType> {
    let leaveType: LeaveType;
    try {
      leaveType = await this.leaveTypes.create(tenantId, {
        name: dto.name,
        code: dto.code,
        isPaid: dto.isPaid,
        defaultEntitlementDays: dto.defaultEntitlementDays,
        createdBy: actorId,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Leave type code "${dto.code}" already exists`);
      }
      throw error;
    }

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'leave.type.created',
      resourceType: 'LeaveType',
      resourceId: leaveType.id,
    });

    return leaveType;
  }

  async findById(tenantId: string, id: string): Promise<LeaveType> {
    const leaveType = await this.leaveTypes.findById(tenantId, id);
    if (!leaveType) {
      throw new NotFoundException(`Leave type "${id}" not found`);
    }
    return leaveType;
  }

  list(tenantId: string, params: { activeOnly?: boolean } = {}): Promise<LeaveType[]> {
    return this.leaveTypes.list(tenantId, params);
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateLeaveTypeDto,
    actorId?: string,
  ): Promise<LeaveType> {
    await this.findById(tenantId, id);

    const updated = await this.leaveTypes.update(tenantId, id, {
      name: dto.name,
      isPaid: dto.isPaid,
      defaultEntitlementDays: dto.defaultEntitlementDays,
      isActive: dto.isActive,
      updatedBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'leave.type.updated',
      resourceType: 'LeaveType',
      resourceId: id,
    });

    return updated;
  }
}
