import type { components } from '@/lib/api-types';

export type Tenant = components['schemas']['TenantResponseDto'];
export type TenantStatus = Tenant['status'];
export type CreateTenantInput = components['schemas']['CreateTenantDto'];
export type UpdateTenantInput = components['schemas']['UpdateTenantDto'];
export type UpdateTenantStatusInput = components['schemas']['UpdateTenantStatusDto'];
export type UpdateTenantAddOnInput = components['schemas']['UpdateTenantAddOnDto'];
export type AddOnModule = Tenant['enabledAddOns'][number];
export type PlatformDashboardSummary = components['schemas']['PlatformDashboardSummaryDto'];
