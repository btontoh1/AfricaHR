// Plain string-union (not a TS `enum`), same reasoning as the other
// domain string-unions in this codebase: stays structurally interchangeable
// with Prisma's generated PayslipLineItemType without casts at the boundary.
export const PayslipLineItemType = {
  EARNING: 'EARNING',
  DEDUCTION: 'DEDUCTION',
} as const;

export type PayslipLineItemType = (typeof PayslipLineItemType)[keyof typeof PayslipLineItemType];
