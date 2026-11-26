import type { components } from '@/lib/api-types';

export type Policy = components['schemas']['PolicyResponseDto'];
export type CreatePolicyInput = components['schemas']['CreatePolicyDto'];
export type CreatePolicyResult = components['schemas']['CreatePolicyResponseDto'];
export type PolicyAcknowledgement = components['schemas']['PolicyAcknowledgementResponseDto'];
export type AudienceScope = Policy['audienceScope'];
