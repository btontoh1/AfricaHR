import type { components } from '@/lib/api-types';

export type Tenant = components['schemas']['Tenant'];
export type TenantStatus = Tenant['status'];
export type CreateTenantInput = components['schemas']['CreateTenantDto'];
export type UpdateTenantStatusInput = components['schemas']['UpdateTenantStatusDto'];
export type PlatformDashboardSummary = components['schemas']['PlatformDashboardSummaryDto'];
