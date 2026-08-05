'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Check, Copy, MessageSquare, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { mfaStatusKey, useMfaConfirm, useMfaConfirmSms, useMfaSetup, useMfaSetupSms } from './queries';
import {
  mfaConfirmFormSchema,
  mfaSmsSetupFormSchema,
  type MfaConfirmFormValues,
  type MfaSmsSetupFormValues,
} from './mfa-form-schema';
import { QrCode } from './qr-code';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

type Step =
  | { name: 'choose-method' }
  | { name: 'start' }
  | { name: 'confirm'; secret: string; otpauthUri: string }
  | { name: 'sms-phone' }
  | { name: 'sms-confirm'; phoneNumber: string }
  | { name: 'backup-codes'; codes: string[] };

function ChooseMethodStep({
  onChooseTotp,
  onChooseSms,
}: {
  onChooseTotp: () => void;
  onChooseSms: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add an extra layer of security to your account. Choose how you&apos;d like to receive your
        sign-in codes.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={onChooseTotp}>
          <ShieldCheck className="size-4" />
          Authenticator app
        </Button>
        <Button type="button" variant="outline" onClick={onChooseSms}>
          <MessageSquare className="size-4" />
          Text message (SMS)
        </Button>
      </div>
    </div>
  );
}

function StartStep({ onStarted }: { onStarted: (secret: string, otpauthUri: string) => void }) {
  const setup = useMfaSetup();

  async function handleStart() {
    try {
      const result = await setup.mutateAsync();
      onStarted(result.secret, result.otpauthUri);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to start MFA setup'));
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You&apos;ll need a code from an authenticator app (like Google Authenticator or Authy) to sign
        in from now on.
      </p>
      <Button type="button" onClick={handleStart} disabled={setup.isPending}>
        {setup.isPending ? 'Starting…' : 'Continue'}
      </Button>
    </div>
  );
}

function ConfirmStep({
  secret,
  otpauthUri,
  onConfirmed,
}: {
  secret: string;
  otpauthUri: string;
  onConfirmed: (codes: string[]) => void;
}) {
  const confirm = useMfaConfirm();
  const [copied, setCopied] = useState(false);

  const form = useForm<MfaConfirmFormValues>({
    resolver: zodResolver(mfaConfirmFormSchema),
    defaultValues: { code: '' },
  });

  async function handleCopySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  async function onSubmit(values: MfaConfirmFormValues) {
    try {
      const result = await confirm.mutateAsync(values.code);
      onConfirmed(result.backupCodes);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid code'));
      form.setValue('code', '');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <QrCode value={otpauthUri} />
        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            Scan this QR code with your authenticator app, or enter this code manually:
          </p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{secret}</code>
            <Button type="button" variant="ghost" size="sm" onClick={handleCopySecret}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-xs space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enter the 6-digit code from your app</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Verifying…' : 'Verify and enable'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function SmsPhoneStep({ onSent }: { onSent: (phoneNumber: string) => void }) {
  const setupSms = useMfaSetupSms();

  const form = useForm<MfaSmsSetupFormValues>({
    resolver: zodResolver(mfaSmsSetupFormSchema),
    defaultValues: { phoneNumber: '' },
  });

  async function onSubmit(values: MfaSmsSetupFormValues) {
    try {
      await setupSms.mutateAsync(values.phoneNumber);
      onSent(values.phoneNumber);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to send verification code'));
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter your phone number in international format. We&apos;ll text you a verification code.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-xs space-y-4">
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone number</FormLabel>
                <FormControl>
                  <Input type="tel" autoComplete="tel" placeholder="+233201234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending…' : 'Send code'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function SmsConfirmStep({
  phoneNumber,
  onConfirmed,
}: {
  phoneNumber: string;
  onConfirmed: (codes: string[]) => void;
}) {
  const confirmSms = useMfaConfirmSms();

  const form = useForm<MfaConfirmFormValues>({
    resolver: zodResolver(mfaConfirmFormSchema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: MfaConfirmFormValues) {
    try {
      const result = await confirmSms.mutateAsync(values.code);
      onConfirmed(result.backupCodes);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid code'));
      form.setValue('code', '');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Enter the 6-digit code we texted to {phoneNumber}.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-xs space-y-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Verification code</FormLabel>
                <FormControl>
                  <Input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    maxLength={6}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Verifying…' : 'Verify and enable'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function BackupCodesStep({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopyAll() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  function handleDownload() {
    const blob = new Blob([codes.join('\n') + '\n'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'africahr-backup-codes.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Save your backup codes</AlertTitle>
        <AlertDescription>
          Each code can be used once to sign in if you lose access to your authenticator app. Store them
          somewhere safe — they won&apos;t be shown again.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/40 p-4 font-mono text-sm sm:grid-cols-3">
        {codes.map((code) => (
          <span key={code}>{code}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleCopyAll}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? 'Copied' : 'Copy all'}
        </Button>
        <Button type="button" variant="outline" onClick={handleDownload}>
          Download
        </Button>
        <Button type="button" onClick={onDone}>
          Done
        </Button>
      </div>
    </div>
  );
}

export function MfaEnrollment() {
  const [step, setStep] = useState<Step>({ name: 'choose-method' });
  const queryClient = useQueryClient();

  function handleDone() {
    setStep({ name: 'choose-method' });
    queryClient.invalidateQueries({ queryKey: mfaStatusKey() });
    toast.success('Two-factor authentication enabled');
  }

  if (step.name === 'choose-method') {
    return (
      <ChooseMethodStep
        onChooseTotp={() => setStep({ name: 'start' })}
        onChooseSms={() => setStep({ name: 'sms-phone' })}
      />
    );
  }

  if (step.name === 'start') {
    return <StartStep onStarted={(secret, otpauthUri) => setStep({ name: 'confirm', secret, otpauthUri })} />;
  }

  if (step.name === 'confirm') {
    return (
      <ConfirmStep
        secret={step.secret}
        otpauthUri={step.otpauthUri}
        onConfirmed={(codes) => setStep({ name: 'backup-codes', codes })}
      />
    );
  }

  if (step.name === 'sms-phone') {
    return <SmsPhoneStep onSent={(phoneNumber) => setStep({ name: 'sms-confirm', phoneNumber })} />;
  }

  if (step.name === 'sms-confirm') {
    return (
      <SmsConfirmStep
        phoneNumber={step.phoneNumber}
        onConfirmed={(codes) => setStep({ name: 'backup-codes', codes })}
      />
    );
  }

  return <BackupCodesStep codes={step.codes} onDone={handleDone} />;
}
