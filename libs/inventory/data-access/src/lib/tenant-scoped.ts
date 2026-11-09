import { Prisma } from '@prisma/client';
import { PrismaService } from '@africahr/platform-database';

/**
 * The transaction-client type withTenantContext's callback receives -
 * every inventory table has a non-nullable tenant_id (RLS_CONVENTION.md
 * §2), so unlike iam-data-access's ScopedClient this lib never needs the
 * withPlatformScope branch, just the type for typing a shared private
 * helper's `tx` parameter (see InventoryStockRepository.applyBalanceDelta).
 */
export type ScopedClient = PrismaService | Prisma.TransactionClient;
