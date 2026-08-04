// Plain string-union (not a TS `enum`), same reasoning as ApplicationStage:
// stays structurally interchangeable with Prisma's generated
// JobRequisitionStatus without casts at the boundary.
export const JobRequisitionStatus = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  ON_HOLD: 'ON_HOLD',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type JobRequisitionStatus = (typeof JobRequisitionStatus)[keyof typeof JobRequisitionStatus];

// DRAFT opens or is scrapped; OPEN can be paused (ON_HOLD), filled (CLOSED),
// or scrapped; ON_HOLD can resume to OPEN or follow the same CLOSED/
// CANCELLED paths as OPEN. CLOSED and CANCELLED are terminal, same as
// ApplicationStage's HIRED/REJECTED/WITHDRAWN - a filled or scrapped
// requisition isn't reopened, a new one is created for a new opening.
const ALLOWED_TRANSITIONS: Record<JobRequisitionStatus, JobRequisitionStatus[]> = {
  [JobRequisitionStatus.DRAFT]: [JobRequisitionStatus.OPEN, JobRequisitionStatus.CANCELLED],
  [JobRequisitionStatus.OPEN]: [
    JobRequisitionStatus.ON_HOLD,
    JobRequisitionStatus.CLOSED,
    JobRequisitionStatus.CANCELLED,
  ],
  [JobRequisitionStatus.ON_HOLD]: [
    JobRequisitionStatus.OPEN,
    JobRequisitionStatus.CLOSED,
    JobRequisitionStatus.CANCELLED,
  ],
  [JobRequisitionStatus.CLOSED]: [],
  [JobRequisitionStatus.CANCELLED]: [],
};

export function canTransitionRequisitionStatus(
  from: JobRequisitionStatus,
  to: JobRequisitionStatus,
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}
