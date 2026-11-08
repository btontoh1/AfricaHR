'use client';

import { Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** A report PDF is always one organization's own letterhead - never "all
 * organizations" - so these are disabled/hidden until a specific
 * organization is selected in the filter above. */
export function ReportPdfButtons({
  organizationSelected,
  viewUrl,
  downloadUrl,
}: {
  organizationSelected: boolean;
  viewUrl: string;
  downloadUrl: string;
}) {
  if (!organizationSelected) {
    return <p className="text-xs text-muted-foreground">Select an organization above to export this report as a PDF.</p>;
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={viewUrl} target="_blank" rel="noreferrer">
          <Eye className="size-4" />
          View PDF
        </a>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={downloadUrl}>
          <Download className="size-4" />
          Download PDF
        </a>
      </Button>
    </div>
  );
}
