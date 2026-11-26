'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useCreatePolicy } from './queries';
import type { AudienceScope, Policy } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { OrganizationUnitPicker } from '@/features/organizations/organization-unit-picker';

type ContentType =
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Mirrors ALLOWED_CONTENT_TYPES in CreatePolicyDto - the backend rejects
// anything else anyway, so this catches it earlier with a clearer message.
const ALLOWED_CONTENT_TYPES: ContentType[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isAllowedContentType(contentType: string): contentType is ContentType {
  return (ALLOWED_CONTENT_TYPES as string[]).includes(contentType);
}

const AUDIENCE_LABELS: Record<AudienceScope, string> = {
  TENANT: 'Everyone (whole group)',
  ORGANIZATION: 'One company',
  ORGANIZATION_UNIT: 'One department',
};

export function UploadPolicyDialog({
  tenantId,
  policies,
}: {
  tenantId: string;
  policies: Policy[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audienceScope, setAudienceScope] = useState<AudienceScope>('TENANT');
  const [organizationId, setOrganizationId] = useState('');
  const [organizationUnitId, setOrganizationUnitId] = useState('');
  const [supersedesId, setSupersedesId] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const createPolicy = useCreatePolicy(tenantId);

  function reset() {
    setTitle('');
    setFolder('');
    setFile(null);
    setAudienceScope('TENANT');
    setOrganizationId('');
    setOrganizationUnitId('');
    setSupersedesId('');
  }

  async function handleSubmit() {
    if (!title.trim() || !folder.trim()) {
      toast.error('Title and folder are required');
      return;
    }
    if (!file) {
      toast.error('Choose a file first');
      return;
    }
    if (!isAllowedContentType(file.type)) {
      toast.error('Only PDF or Word documents are accepted');
      return;
    }
    if (audienceScope === 'ORGANIZATION' && !organizationId) {
      toast.error('Choose which company this applies to');
      return;
    }
    if (audienceScope === 'ORGANIZATION_UNIT' && !organizationUnitId) {
      toast.error('Choose which department this applies to');
      return;
    }

    setIsUploading(true);
    try {
      const { uploadUrl } = await createPolicy.mutateAsync({
        title: title.trim(),
        folder: folder.trim(),
        fileName: file.name,
        contentType: file.type,
        audienceScope,
        organizationId: audienceScope === 'ORGANIZATION' ? organizationId : undefined,
        organizationUnitId: audienceScope === 'ORGANIZATION_UNIT' ? organizationUnitId : undefined,
        supersedesId: supersedesId || undefined,
      });

      // Straight to storage, not through this app's own /api/* proxy - same
      // pattern as UploadVerificationDocumentForm.
      const putResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!putResponse.ok) {
        throw new Error('Upload to storage failed');
      }

      toast.success('Policy published');
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to publish policy'));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Upload policy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a policy document</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Annual Leave Policy" />
          </div>
          <div className="space-y-1.5">
            <Label>Folder</Label>
            <Input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Leave, Conduct, Finance…" />
          </div>
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Who should see this</Label>
            <Select
              value={audienceScope}
              onValueChange={(next) => {
                setAudienceScope(next as AudienceScope);
                setOrganizationId('');
                setOrganizationUnitId('');
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(AUDIENCE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {audienceScope === 'ORGANIZATION' && (
            <div className="space-y-1.5">
              <Label>Company</Label>
              <OrganizationPicker tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
            </div>
          )}
          {audienceScope === 'ORGANIZATION_UNIT' && (
            <div className="space-y-1.5">
              <Label>Company</Label>
              <OrganizationPicker tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
              <Label>Department</Label>
              <OrganizationUnitPicker
                tenantId={tenantId}
                organizationId={organizationId}
                value={organizationUnitId}
                onChange={setOrganizationUnitId}
              />
            </div>
          )}
          {policies.length > 0 && (
            <div className="space-y-1.5">
              <Label>Replaces (optional)</Label>
              <Select
                value={supersedesId || '__none__'}
                onValueChange={(next) => setSupersedesId(next === '__none__' ? '' : next)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="This is a new policy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">This is a new policy</SelectItem>
                  {policies.map((policy) => (
                    <SelectItem key={policy.id} value={policy.id}>
                      {policy.title} (v{policy.version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? 'Uploading…' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
