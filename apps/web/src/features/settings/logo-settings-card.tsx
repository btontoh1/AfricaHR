'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MY_TENANT_KEY, useRemoveLogo, useRequestLogoUpload } from './queries';
import type { MyTenant } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ContentType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';

// Mirrors ALLOWED_CONTENT_TYPES in RequestTenantLogoUploadDto - the backend
// rejects anything else anyway, so this catches it earlier with a clearer
// message than a raw 400 would.
const ALLOWED_CONTENT_TYPES: ContentType[] = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

function isAllowedContentType(contentType: string): contentType is ContentType {
  return (ALLOWED_CONTENT_TYPES as string[]).includes(contentType);
}

export function LogoSettingsCard({ tenant }: { tenant: MyTenant }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const requestUpload = useRequestLogoUpload();
  const removeLogo = useRemoveLogo();
  const queryClient = useQueryClient();

  async function handleUpload() {
    if (!file) {
      toast.error('Choose an image first');
      return;
    }
    if (!isAllowedContentType(file.type)) {
      toast.error('Only PNG, JPEG, WebP, or SVG images are accepted');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl } = await requestUpload.mutateAsync({
        fileName: file.name,
        contentType: file.type,
      });

      // Straight to storage, not through this app's own /api/* proxy - see
      // the doc comment on useRequestDocumentUpload (the equivalent flow
      // for verification documents).
      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResponse.ok) {
        throw new Error('Upload to storage failed');
      }

      toast.success('Logo uploaded');
      setFile(null);
      await queryClient.invalidateQueries({ queryKey: MY_TENANT_KEY });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload logo'));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    try {
      await removeLogo.mutateAsync();
      toast.success('Logo removed');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove logo'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business logo</CardTitle>
        <CardDescription>Shown to your whole team in the sidebar, in place of the default mark.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt="Business logo" className="size-full object-contain" />
            ) : (
              <span className="px-1 text-center text-xs text-muted-foreground">No logo</span>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button type="button" onClick={handleUpload} disabled={isUploading || !file}>
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
          {tenant.logoUrl && (
            <Button type="button" variant="outline" onClick={handleRemove} disabled={removeLogo.isPending}>
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
