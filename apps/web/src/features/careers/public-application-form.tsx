'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import { useRequestIdentityDocumentUpload, useRequestResumeUpload, useSubmitPublicApplication } from './queries';
import { publicApplicationFormSchema, type PublicApplicationFormValues } from './careers-form-schema';
import type { IdentityDocumentType, PublicJobRequisition } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mirrors RequestPublicResumeUploadDto's ALLOWED_RESUME_CONTENT_TYPES —
// the backend rejects anything else anyway, so this catches it earlier
// with a clearer message than a raw 400 would. Declared as a const tuple
// (not string[]) so isResumeContentType below can narrow File.type — a
// plain DOM string — down to the literal union the generated
// RequestPublicResumeUploadDto type expects.
const RESUME_CONTENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;
type ResumeContentType = (typeof RESUME_CONTENT_TYPES)[number];
function isResumeContentType(type: string): type is ResumeContentType {
  return (RESUME_CONTENT_TYPES as readonly string[]).includes(type);
}

// Mirrors RequestPublicIdentityDocumentUploadDto's ALLOWED_IDENTITY_DOCUMENT_CONTENT_TYPES.
const IDENTITY_DOCUMENT_CONTENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;
type IdentityDocumentContentType = (typeof IDENTITY_DOCUMENT_CONTENT_TYPES)[number];
function isIdentityDocumentContentType(type: string): type is IdentityDocumentContentType {
  return (IDENTITY_DOCUMENT_CONTENT_TYPES as readonly string[]).includes(type);
}

const IDENTITY_DOCUMENT_TYPE_OPTIONS: { value: IdentityDocumentType; label: string }[] = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID (e.g. Ghana Card)' },
  { value: 'DRIVERS_LICENSE', label: "Driver's license" },
  { value: 'OTHER', label: 'Other government ID' },
];

async function putToStorage(uploadUrl: string, file: File): Promise<void> {
  // Straight to storage, not through this app's own /api/* proxy — see the
  // doc comment on StorageService (server) / useRequestDocumentUpload
  // (the equivalent authenticated-side hook this mirrors).
  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!putResponse.ok) {
    throw new Error('Upload to storage failed');
  }
}

export function PublicApplicationForm({ requisition }: { requisition: PublicJobRequisition }) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [identityDocumentType, setIdentityDocumentType] = useState<IdentityDocumentType | ''>('');

  const submitApplication = useSubmitPublicApplication(requisition.id);
  const requestResumeUpload = useRequestResumeUpload(requisition.id);
  const requestIdentityDocumentUpload = useRequestIdentityDocumentUpload(requisition.id);

  const form = useForm<PublicApplicationFormValues>({
    resolver: zodResolver(publicApplicationFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
  });

  function handleResumeChange(file: File | null) {
    if (file && !isResumeContentType(file.type)) {
      setSubmitError('Resume must be a PDF or Word document');
      return;
    }
    setSubmitError(null);
    setResumeFile(file);
  }

  function handleIdentityFileChange(file: File | null) {
    if (file && !isIdentityDocumentContentType(file.type)) {
      setSubmitError('Government ID must be a PDF, PNG, or JPEG');
      return;
    }
    setSubmitError(null);
    setIdentityFile(file);
  }

  async function uploadResume(file: File): Promise<string> {
    if (!isResumeContentType(file.type)) {
      throw new Error('Resume must be a PDF or Word document');
    }
    const result = await requestResumeUpload.mutateAsync({ fileName: file.name, contentType: file.type });
    if (!result) {
      throw new Error('Failed to prepare resume upload');
    }
    await putToStorage(result.uploadUrl, file);
    return result.storageKey;
  }

  async function uploadIdentityDocument(file: File): Promise<string> {
    if (!isIdentityDocumentContentType(file.type)) {
      throw new Error('Government ID must be a PDF, PNG, or JPEG');
    }
    const result = await requestIdentityDocumentUpload.mutateAsync({
      fileName: file.name,
      contentType: file.type,
    });
    if (!result) {
      throw new Error('Failed to prepare government ID upload');
    }
    await putToStorage(result.uploadUrl, file);
    return result.storageKey;
  }

  async function onSubmit(values: PublicApplicationFormValues) {
    setSubmitError(null);

    if (identityFile && !identityDocumentType) {
      setSubmitError('Choose the type of government ID you uploaded');
      return;
    }

    try {
      const [resumeStorageKey, identityDocumentStorageKey] = await Promise.all([
        resumeFile ? uploadResume(resumeFile) : Promise.resolve(undefined),
        identityFile ? uploadIdentityDocument(identityFile) : Promise.resolve(undefined),
      ]);

      await submitApplication.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone ? values.phone : undefined,
        resumeStorageKey,
        resumeFileName: resumeStorageKey ? resumeFile?.name : undefined,
        identityDocumentStorageKey,
        identityDocumentFileName: identityDocumentStorageKey ? identityFile?.name : undefined,
        identityDocumentType: identityDocumentStorageKey ? (identityDocumentType as IdentityDocumentType) : undefined,
      });
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Failed to submit your application'));
    }
  }

  if (submitApplication.isSuccess) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="size-10 text-primary" />
          <h2 className="text-lg font-semibold">Application received</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Thanks for applying to <span className="font-medium">{requisition.title}</span>. The hiring team
            will review your application and reach out if there&apos;s a match.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isSubmitting =
    form.formState.isSubmitting || requestResumeUpload.isPending || requestIdentityDocumentUpload.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Apply for this role</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1.5">
              <Label>Resume (optional)</Label>
              <Input
                type="file"
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => handleResumeChange(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">PDF or Word document</p>
            </div>

            <div className="space-y-1.5">
              <Label>Government-issued ID (optional)</Label>
              <p className="text-xs text-muted-foreground">
                e.g. passport, driver&apos;s license, national ID card (Ghana Card, etc.)
              </p>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={identityDocumentType}
                  onValueChange={(value) => setIdentityDocumentType(value as IdentityDocumentType)}
                >
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder="Document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {IDENTITY_DOCUMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="file"
                  className="flex-1"
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={(event) => handleIdentityFileChange(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            {submitError && <p className="text-sm text-destructive">{submitError}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : 'Submit application'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
