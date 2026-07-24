import { Injectable } from '@nestjs/common';
import { OrganizationVerificationDocument, VerificationDocumentType } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

export interface CreateOrganizationVerificationDocumentInput {
  organizationId: string;
  documentType: VerificationDocumentType;
  storageKey: string;
  fileName: string;
  contentType: string;
  createdBy?: string;
}

@Injectable()
export class OrganizationVerificationDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(
    tenantId: string,
    input: CreateOrganizationVerificationDocumentInput,
  ): Promise<OrganizationVerificationDocument> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationVerificationDocument.create({
        data: {
          tenantId,
          organizationId: input.organizationId,
          documentType: input.documentType,
          storageKey: input.storageKey,
          fileName: input.fileName,
          contentType: input.contentType,
          createdBy: input.createdBy,
        },
      }),
    );
  }

  findById(tenantId: string, id: string): Promise<OrganizationVerificationDocument | null> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationVerificationDocument.findFirst({ where: { id, tenantId, deletedAt: null } }),
    );
  }

  listByOrganization(tenantId: string, organizationId: string): Promise<OrganizationVerificationDocument[]> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationVerificationDocument.findMany({
        where: { tenantId, organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  softDelete(tenantId: string, id: string): Promise<OrganizationVerificationDocument> {
    return this.prisma.withTenantContext(tenantId, (tx) =>
      tx.organizationVerificationDocument.update({
        where: { id },
        data: { deletedAt: new Date() },
      }),
    );
  }

  /**
   * Cross-tenant — a platform-admin reviewer viewing a document from the
   * verification queue doesn't know the tenantId up front. Same
   * withPlatformScope pitfall as OrganizationRepository.listPendingReview
   * (non-nullable tenant_id -> plain RLS policy -> the platform sentinel
   * never matches), so this goes through the same §5 SECURITY DEFINER
   * pattern instead.
   */
  async findByIdAcrossTenants(id: string): Promise<OrganizationVerificationDocument | null> {
    const rows = await this.prisma.$queryRaw<
      OrganizationVerificationDocument[]
    >`SELECT * FROM find_verification_document_by_id_across_tenants(${id})`;
    return rows[0] ?? null;
  }

  /** Cross-tenant, same reasoning and pattern as findByIdAcrossTenants — a reviewer needs every document for an org, not just one already-known id. */
  listByOrganizationAcrossTenants(organizationId: string): Promise<OrganizationVerificationDocument[]> {
    return this.prisma.$queryRaw<
      OrganizationVerificationDocument[]
    >`SELECT * FROM find_verification_documents_by_organization_across_tenants(${organizationId})`;
  }
}
