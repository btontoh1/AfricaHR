import { redirect } from 'next/navigation';
import { ShieldCheck, Users, Wallet } from 'lucide-react';
import { getSession } from '@/lib/session';
import { needsSetup } from '@/lib/setup-status';
import { LoginForm } from './login-form';

const highlights = [
  { icon: Users, text: 'One system for employees, payroll, and performance' },
  { icon: Wallet, text: 'Built for African payroll and labor law from day one' },
  { icon: ShieldCheck, text: 'Enterprise-grade tenant isolation and access control' },
];

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  if (await needsSetup()) {
    redirect('/setup');
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-lg font-bold">
            A
          </div>
          <span className="text-xl font-semibold tracking-tight">AfricaHR</span>
        </div>
        <div className="relative space-y-8">
          <h2 className="text-3xl leading-tight font-semibold text-balance">
            HR &amp; payroll built for how African businesses actually work.
          </h2>
          <ul className="space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-primary-foreground/90">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Icon className="size-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/70">
          &copy; {new Date().getFullYear()} AfricaHR. All rights reserved.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-background p-6 lg:w-1/2">
        <LoginForm />
      </div>
    </div>
  );
}
