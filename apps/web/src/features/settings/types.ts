import type { components } from '@/lib/api-types';

export type MyTenant = components['schemas']['TenantMeResponseDto'];
export type RequestTenantLogoUploadInput = components['schemas']['RequestTenantLogoUploadDto'];
export type PerformanceFramework = MyTenant['performanceFramework'];
