import type { components } from '@/lib/api-types';

export type User = components['schemas']['UserResponseDto'];
export type CreateUserInput = components['schemas']['CreateUserDto'];
export type UpdateUserProfileInput = components['schemas']['UpdateUserProfileDto'];
export type AdminResetPasswordInput = components['schemas']['AdminResetPasswordDto'];
export type SystemRole = User['role'];
