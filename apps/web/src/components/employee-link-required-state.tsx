import { UserRoundX } from 'lucide-react';
import { EmptyState } from './empty-state';

/** Shown instead of ErrorState wherever isNoEmployeeLinkedError(error) is true. */
export function EmployeeLinkRequiredState({ className }: { className?: string }) {
  return (
    <EmptyState
      icon={UserRoundX}
      title="Not linked to an employee record"
      description="This account isn't linked to an employee record yet, so there's nothing to show here. Ask a Tenant Admin, HR Manager, or Org Admin to link it under Employees → Portal access."
      className={className}
    />
  );
}
