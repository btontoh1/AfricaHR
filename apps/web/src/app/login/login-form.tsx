'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const mfaSchema = z.object({
  code: z.string().min(1, 'Enter a code'),
  rememberDevice: z.boolean(),
});

type MfaFormValues = z.infer<typeof mfaSchema>;

export interface LoginFormProps {
  /** When set, scopes login to this tenant's slug instead of the global lookup. */
  tenantSlug?: string;
  tenantName?: string;
}

export function LoginForm({ tenantSlug, tenantName }: LoginFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mfaForm = useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues: { code: '', rememberDevice: false },
  });

  function redirectAfterLogin() {
    const redirectTo = searchParams.get('from') ?? '/dashboard';
    router.push(redirectTo);
    router.refresh();
  }

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    const endpoint = tenantSlug
      ? `/api/tenants/${encodeURIComponent(tenantSlug)}/login`
      : '/api/auth/login';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
      setServerError(message ?? 'Invalid email or password');
      return;
    }

    if (body?.mfaRequired) {
      setChallengeToken(body.challengeToken);
      return;
    }

    redirectAfterLogin();
  }

  async function onSubmitMfa(values: MfaFormValues) {
    setServerError(null);
    const response = await fetch('/api/auth/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeToken, code: values.code, rememberDevice: values.rememberDevice }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
      setServerError(message ?? 'Invalid code');
      return;
    }

    redirectAfterLogin();
  }

  function backToSignIn() {
    setChallengeToken(null);
    setServerError(null);
    mfaForm.reset();
  }

  // Both steps stay mounted the whole time, toggled by the `hidden` class
  // instead of one replacing the other in the tree — swapping which
  // react-hook-form Controller is mounted mid-flow (unmounting the
  // email/password fields while mounting the code field in the same
  // commit) silently drops the new field's onChange updates under
  // React 19 + this Radix Slot / react-hook-form combination.
  return (
    <div className="w-full max-w-sm">
      <div className={cn(challengeToken && 'hidden')}>
        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {tenantName ? `Sign in to ${tenantName}` : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground">Sign in with your work email and password.</p>
        </div>
        <Form {...form}>
          <form method="post" onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        placeholder="you@company.com"
                        className="pl-9"
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <FormControl>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        className="pr-9 pl-9"
                        {...field}
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {!challengeToken && serverError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Form>
      </div>

      <div className={cn(!challengeToken && 'hidden')}>
        <div className="mb-8 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Two-factor authentication</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app, or one of your backup codes.
          </p>
        </div>
        <Form {...mfaForm}>
          <form method="post" onSubmit={mfaForm.handleSubmit(onSubmitMfa)} noValidate className="space-y-4">
            <FormField
              control={mfaForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    {/* No inputMode="numeric" here (unlike the enrollment
                        confirm step): this field also accepts backup codes
                        (XXXXX-XXXXX), and a numeric-only mobile keyboard
                        would make those impossible to type. */}
                    <Input autoComplete="one-time-code" placeholder="123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={mfaForm.control}
              name="rememberDevice"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="!mt-0 font-normal">Remember this device for 30 days</FormLabel>
                </FormItem>
              )}
            />
            {challengeToken && serverError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={mfaForm.formState.isSubmitting}>
              {mfaForm.formState.isSubmitting ? 'Verifying…' : 'Verify'}
            </Button>
            <button
              type="button"
              onClick={backToSignIn}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
}
