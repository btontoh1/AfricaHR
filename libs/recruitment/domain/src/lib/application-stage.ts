// Plain string-union (not a TS `enum`), same reasoning as the other domain
// string-unions in this codebase: stays structurally interchangeable with
// Prisma's generated ApplicationStage without casts at the boundary.
export const ApplicationStage = {
  APPLIED: 'APPLIED',
  SCREENING: 'SCREENING',
  INTERVIEW: 'INTERVIEW',
  OFFER: 'OFFER',
  HIRED: 'HIRED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type ApplicationStage = (typeof ApplicationStage)[keyof typeof ApplicationStage];

// Linear progression (APPLIED -> SCREENING -> INTERVIEW -> OFFER -> HIRED),
// with REJECTED/WITHDRAWN reachable as an escape hatch from any active
// (non-terminal) stage — a candidate can be rejected or withdraw at any
// point before being hired. HIRED is only reachable from OFFER.
const ALLOWED_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  [ApplicationStage.APPLIED]: [
    ApplicationStage.SCREENING,
    ApplicationStage.REJECTED,
    ApplicationStage.WITHDRAWN,
  ],
  [ApplicationStage.SCREENING]: [
    ApplicationStage.INTERVIEW,
    ApplicationStage.REJECTED,
    ApplicationStage.WITHDRAWN,
  ],
  [ApplicationStage.INTERVIEW]: [
    ApplicationStage.OFFER,
    ApplicationStage.REJECTED,
    ApplicationStage.WITHDRAWN,
  ],
  [ApplicationStage.OFFER]: [
    ApplicationStage.HIRED,
    ApplicationStage.REJECTED,
    ApplicationStage.WITHDRAWN,
  ],
  [ApplicationStage.HIRED]: [],
  [ApplicationStage.REJECTED]: [],
  [ApplicationStage.WITHDRAWN]: [],
};

export function canTransitionApplicationStage(
  from: ApplicationStage,
  to: ApplicationStage,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}
