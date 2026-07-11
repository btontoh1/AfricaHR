import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { needsSetup } from '@/lib/setup-status';
import { SetupWizardForm } from '@/features/setup/setup-wizard-form';

export default async function SetupPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  if (!(await needsSetup())) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <SetupWizardForm />
    </div>
  );
}
