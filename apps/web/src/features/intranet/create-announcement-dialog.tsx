'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useSession } from '@/app/(app)/session-provider';
import { useCreateAnnouncement } from './announcement-queries';
import type { AudienceScope } from './types';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { OrganizationUnitPicker } from '@/features/organizations/organization-unit-picker';

type ContentType = 'application/pdf' | 'application/msword' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'image/png' | 'image/jpeg';

const ALLOWED_CONTENT_TYPES: ContentType[] = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];

function isAllowedContentType(contentType: string): contentType is ContentType {
  return (ALLOWED_CONTENT_TYPES as string[]).includes(contentType);
}

const AUDIENCE_LABELS: Record<AudienceScope, string> = {
  TENANT: 'Everyone (whole group)',
  ORGANIZATION: 'One company',
  ORGANIZATION_UNIT: 'One department',
};

export function CreateAnnouncementDialog({ tenantId }: { tenantId: string }) {
  const session = useSession();
  // Department heads only ever post to their own department - no scope
  // picker for them, same restriction AnnouncementService enforces.
  const isUnitAdmin = session.role === 'UNIT_ADMIN';

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audienceScope, setAudienceScope] = useState<AudienceScope>(isUnitAdmin ? 'ORGANIZATION_UNIT' : 'TENANT');
  const [organizationId, setOrganizationId] = useState('');
  const [organizationUnitId, setOrganizationUnitId] = useState(
    isUnitAdmin ? (session.organizationUnitId ?? '') : '',
  );
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createAnnouncement = useCreateAnnouncement(tenantId);

  function reset() {
    setTitle('');
    setBody('');
    setFile(null);
    setAudienceScope(isUnitAdmin ? 'ORGANIZATION_UNIT' : 'TENANT');
    setOrganizationId('');
    setOrganizationUnitId(isUnitAdmin ? (session.organizationUnitId ?? '') : '');
    setPinned(false);
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }
    if (file && !isAllowedContentType(file.type)) {
      toast.error('Only PDF, Word documents, or PNG/JPEG images are accepted');
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

    setIsSubmitting(true);
    try {
      const { uploadUrl } = await createAnnouncement.mutateAsync({
        title: title.trim(),
        body: body.trim(),
        audienceScope,
        organizationId: audienceScope === 'ORGANIZATION' ? organizationId : undefined,
        organizationUnitId: audienceScope === 'ORGANIZATION_UNIT' ? organizationUnitId : undefined,
        pinned,
        attachmentFileName: file ? file.name : undefined,
        attachmentContentType: file ? (file.type as ContentType) : undefined,
      });

      if (uploadUrl && file) {
        const putResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!putResponse.ok) {
          throw new Error('Upload to storage failed');
        }
      }

      toast.success('Announcement posted');
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to post announcement'));
    } finally {
      setIsSubmitting(false);
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
          Post announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post an announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Office closed Friday" />
          </div>
          <div className="space-y-1.5">
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label>Picture or attachment (optional)</Label>
            <Input
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>
          {!isUnitAdmin && (
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
          )}
          {!isUnitAdmin && audienceScope === 'ORGANIZATION' && (
            <div className="space-y-1.5">
              <Label>Company</Label>
              <OrganizationPicker tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
            </div>
          )}
          {!isUnitAdmin && audienceScope === 'ORGANIZATION_UNIT' && (
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
          <div className="flex items-center gap-2">
            <Checkbox id="pinned" checked={pinned} onCheckedChange={(checked) => setPinned(checked === true)} />
            <Label htmlFor="pinned" className="font-normal">
              Pin this post to the top of the feed
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Posting…' : 'Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
