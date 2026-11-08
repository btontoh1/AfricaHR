'use client';

import { CreateExpenseDialog } from './create-expense-dialog';
import { ExpensesList } from './expenses-list';

export function ExpensesView({ tenantId }: { tenantId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateExpenseDialog tenantId={tenantId} />
      </div>

      <ExpensesList tenantId={tenantId} />
    </div>
  );
}
