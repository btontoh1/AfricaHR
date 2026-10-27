import type { components } from '@/lib/api-types';

export type WalletBalance = components['schemas']['WalletBalanceResponseDto'];
export type WalletTopUp = components['schemas']['WalletTopUpResponseDto'];
export type RequestWalletTopUpInput = components['schemas']['RequestWalletTopUpDto'];
export type WalletTopUpStatus = WalletTopUp['status'];
