import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { OrganizationVerificationDocument } from '@prisma/client';
import { AuditService } from '@africahr/platform-audit';
import { StorageService } from '@africahr/platform-storage';
import { OrganizationVerificationDocumentRepository } from '@africahr/tenancy-data-access';
import { OrganizationService } from './organization.service';
import { RequestVerificationDocumentUploadDto } from './dto/request-verification-document-upload.dto';

export interface RequestUploadResult {
  uploadUrl: string;
  documentId: string;
}

@Injectable()
export class OrganizationVerificationDocumentService {
  constructor(
    private readonly documents: OrganizationVerificationDocumentRepository,
    private readonly organizations: OrganizationService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async requestUpload(
    tenantId: string,
    organizationId: string,
    dto: RequestVerificationDocumentUploadDto,
    actorId?: string,
  ): Promise<RequestUploadResult> {
    // Confirms the org exists and belongs to this tenant before minting a
    // key for it - same guard every other tenant-nested write in this
    // module makes. OrganizationService.findById throws NotFoundException
    // itself, unlike the bare repository lookup.
    await this.organizations.findById(tenantId, organizationId);

    const storageKey = `verification-docs/${tenantId}/${organizationId}/${randomUUID()}-${dto.fileName}`;
    const uploadUrl = await this.storage.getUploadUrl(storageKey, dto.contentType);

    const document = await this.documents.create(tenantId, {
      organizationId,
      documentType: dto.documentType,
      storageKey,
      fileName: dto.fileName,
      contentType: dto.contentType,
      createdBy: actorId,
    });

    await this.audit.record({
      tenantId,
      actorUserId: actorId ?? null,
      action: 'organization.verification_document_added',
      resourceType: 'OrganizationVerificationDocument',
      resourceId: document.id,
      metadata: { organizationId, documentType: dto.documentType },
    });

    return { uploadUrl, documentId: document.id };
  }

  listByOrganization(tenantId: string, organizationId: string): Promise<OrganizationVerificationDocument[]> {
    return this.documents.listByOrganization(tenantId, organizationId);
  }

  async getViewUrl(tenantId: string, id: string): Promise<string> {
    const document = await this.documents.findById(tenantId, id);
    if (!document) {
      throw new NotFoundException(`Verification document "${id}" not found`);
    }
    return this.storage.getViewUrl(document.storageKey);
  }

  /** Platform-admin-facing, cross-tenant — a reviewer views documents from the verification queue without knowing the tenantId up front. */
  async getViewUrlAcrossTenants(id: string): Promise<string> {
    const document = await this.documents.findByIdAcrossTenants(id);
    if (!document) {
      throw new NotFoundException(`Verification document "${id}" not found`);
    }
    return this.storage.getViewUrl(document.storageKey);
  }

  /** Platform-admin-facing, cross-tenant — a reviewer needs every document for an org, not just one already-known id. */
  listByOrganizationAcrossTenants(organizationId: string): Promise<OrganizationVerificationDocument[]> {
    return this.documents.listByOrganizationAcrossTenants(organizationId);
  }
}
