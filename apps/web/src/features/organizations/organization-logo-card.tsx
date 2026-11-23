'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  useOrganizationLogoUrl,
  useOrganizationSecondaryLogoUrl,
  useRemoveOrganizationLogo,
  useRemoveOrganizationSecondaryLogo,
  useRequestOrganizationLogoUpload,
  useRequestOrganizationSecondaryLogoUpload,
} from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ContentType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/svg+xml';

// Mirrors ALLOWED_CONTENT_TYPES in RequestOrganizationLogoUploadDto /
// RequestOrganizationSecondaryLogoUploadDto (identical allowlist for both).
const ALLOWED_CONTENT_TYPES: ContentType[] = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

function isAllowedContentType(contentType: string): contentType is ContentType {
  return (ALLOWED_CONTENT_TYPES as string[]).includes(contentType);
}

/**
 * One upload/preview/remove slot - used twice below for the organization's
 * own logo and its optional secondary mark (e.g. IATA, an accreditation
 * body). Each slot's upload/remove mutations and current view URL are
 * passed in rather than looked up here, so this stays agnostic to which
 * slot it's rendering.
 */
function LogoSlot({
  emptyLabel,
  viewUrl,
  onUpload,
  onRemove,
  isRemoving,
}: {
  emptyLabel: string;
  viewUrl: string | null | undefined;
  // contentType is passed separately, already narrowed by
  // isAllowedContentType below - narrowing a File's .type doesn't survive
  // being read again from inside a different closure (the caller's
  // onUpload), so this is handed over explicitly instead.
  onUpload: (file: File, contentType: ContentType) => Promise<void>;
  onRemove: () => Promise<void>;
  isRemoving: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      await onUpload(file, file.type);
      toast.success('Logo uploaded');
      setFile(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload logo'));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    try {
      await onRemove();
      toast.success('Logo removed');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to remove logo'));
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {viewUrl ? (
          <img src={viewUrl} alt="Logo" className="size-full object-contain" />
        ) : (
          <span className="px-1 text-center text-xs text-muted-foreground">{emptyLabel}</span>
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
      {viewUrl && (
        <Button type="button" variant="outline" onClick={handleRemove} disabled={isRemoving}>
          Remove
        </Button>
      )}
    </div>
  );
}

export function OrganizationLogoCard({ tenantId, organizationId }: { tenantId: string; organizationId: string }) {
  const { data: logo, refetch: refetchLogo } = useOrganizationLogoUrl(tenantId, organizationId);
  const requestUpload = useRequestOrganizationLogoUpload(tenantId, organizationId);
  const removeLogo = useRemoveOrganizationLogo(tenantId, organizationId);

  const { data: secondaryLogo, refetch: refetchSecondaryLogo } = useOrganizationSecondaryLogoUrl(
    tenantId,
    organizationId,
  );
  const requestSecondaryUpload = useRequestOrganizationSecondaryLogoUpload(tenantId, organizationId);
  const removeSecondaryLogo = useRemoveOrganizationSecondaryLogo(tenantId, organizationId);

  async function uploadToSignedUrl(uploadUrl: string, file: File) {
    // Straight to storage, not through this app's own /api/* proxy - same
    // pattern as LogoSettingsCard's identical tenant-level logo upload.
    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!putResponse.ok) {
      throw new Error('Upload to storage failed');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice logos</CardTitle>
        <CardDescription>
          Shown on invoices this organization sends to its own customers - the primary logo on the left, and an
          optional second mark (e.g. an IATA or other accreditation logo) on the right, with the organization's
          name and address centered between them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="mb-2 text-sm font-medium">Primary logo</div>
          <LogoSlot
            emptyLabel="No logo"
            viewUrl={logo?.viewUrl}
            isRemoving={removeLogo.isPending}
            onUpload={async (file, contentType) => {
              const { uploadUrl } = await requestUpload.mutateAsync({ fileName: file.name, contentType });
              await uploadToSignedUrl(uploadUrl, file);
              await refetchLogo();
            }}
            onRemove={() => removeLogo.mutateAsync()}
          />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium">Secondary logo (optional)</div>
          <LogoSlot
            emptyLabel="No logo"
            viewUrl={secondaryLogo?.viewUrl}
            isRemoving={removeSecondaryLogo.isPending}
            onUpload={async (file, contentType) => {
              const { uploadUrl } = await requestSecondaryUpload.mutateAsync({
                fileName: file.name,
                contentType,
              });
              await uploadToSignedUrl(uploadUrl, file);
              await refetchSecondaryLogo();
            }}
            onRemove={() => removeSecondaryLogo.mutateAsync()}
          />
        </div>
      </CardContent>
    </Card>
  );
}
