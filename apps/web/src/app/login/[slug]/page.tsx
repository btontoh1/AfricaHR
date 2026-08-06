import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertCircle, ShieldCheck, Users, Wallet } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getTenantBySlug } from '@/lib/tenant-lookup';
import { Logo } from '@/components/logo';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LoginForm } from '../login-form';

const highlights = [
  { icon: Users, text: 'One system for employees, payroll, and performance' },
  { icon: Wallet, text: 'Built for African payroll and labor law from day one' },
  { icon: ShieldCheck, text: 'Enterprise-grade tenant isolation and access control' },
];

export default async function TenantLoginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }

  const tenant = await getTenantBySlug(slug);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:w-1/2 lg:p-10">
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
          <Logo className="size-9 rounded-lg" />
          <span className="text-xl font-semibold tracking-tight">ParotHR</span>
        </div>
        <div className="relative space-y-8 py-8 lg:py-0">
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
          &copy; {new Date().getFullYear()} ParotHR. All rights reserved.
        </p>
      </div>

      <div className="flex w-full flex-1 flex-col items-center justify-center bg-background p-6 lg:w-1/2">
        {tenant ? (
          <LoginForm tenantSlug={tenant.slug} tenantName={tenant.name} />
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Organization not found</h1>
              <p className="text-sm text-muted-foreground">
                We couldn&apos;t find an organization at this link. Double-check the URL your admin
                shared with you.
              </p>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>No organization matches &ldquo;{slug}&rdquo;.</AlertDescription>
            </Alert>
            <Button asChild className="w-full">
              <Link href="/login">Go to sign in</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
