import type { LeaveRequestStatus } from './types';

export function LeaveRequestReasonCell({
  reason,
  rejectionReason,
  status,
}: {
  reason?: string;
  rejectionReason?: string;
  status: LeaveRequestStatus;
}) {
  return (
    <div className="max-w-xs space-y-0.5">
      <p className="truncate text-sm">{reason ?? '—'}</p>
      {status === 'REJECTED' && rejectionReason && (
        <p className="truncate text-xs text-destructive">Rejected: {rejectionReason}</p>
      )}
    </div>
  );
}
