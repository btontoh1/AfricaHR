'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRequestDocumentUpload } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import type { VerificationDocument } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type DocumentType = VerificationDocument['documentType'];
type ContentType = 'application/pdf' | 'image/png' | 'image/jpeg';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'CERTIFICATE_OF_INCORPORATION', label: 'Certificate of incorporation' },
  { value: 'TAX_CLEARANCE_CERTIFICATE', label: 'Tax clearance certificate' },
  { value: 'OTHER', label: 'Other' },
];

// Mirrors ALLOWED_CONTENT_TYPES in RequestVerificationDocumentUploadDto -
// the backend rejects anything else anyway, so this catches it earlier
// with a clearer message than a raw 400 would.
const ALLOWED_CONTENT_TYPES: ContentType[] = ['application/pdf', 'image/png', 'image/jpeg'];

function isAllowedContentType(contentType: string): contentType is ContentType {
  return (ALLOWED_CONTENT_TYPES as string[]).includes(contentType);
}

export function UploadVerificationDocumentForm({
  tenantId,
  organizationId,
}: {
  tenantId: string;
  organizationId: string;
}) {
  const [documentType, setDocumentType] = useState<DocumentType>('CERTIFICATE_OF_INCORPORATION');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const requestUpload = useRequestDocumentUpload(tenantId, organizationId);

  async function handleUpload() {
    if (!file) {
      toast.error('Choose a file first');
      return;
    }
    if (!isAllowedContentType(file.type)) {
      toast.error('Only PDF, PNG, or JPEG files are accepted');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl } = await requestUpload.mutateAsync({
        documentType,
        fileName: file.name,
        contentType: file.type,
      });

      // Straight to storage, not through this app's own /api/* proxy - see
      // the doc comment on useRequestDocumentUpload.
      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResponse.ok) {
        throw new Error('Upload to storage failed');
      }

      toast.success('Document uploaded');
      setFile(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload document'));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label>Document type</Label>
        <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>File</Label>
        <Input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="button" onClick={handleUpload} disabled={isUploading || !file}>
        {isUploading ? 'Uploading…' : 'Upload'}
      </Button>
    </div>
  );
}
