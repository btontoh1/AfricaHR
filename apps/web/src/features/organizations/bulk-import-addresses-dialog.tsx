'use client';

import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkImportOrganizationAddresses, useOrganizations } from './queries';
import { getApiErrorMessage } from '@/lib/api-error';
import type { OrganizationAddressImportResult } from './types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function csvCell(value: string | null | undefined): string {
  const text = value ?? '';
  // Quote whenever the value could otherwise break column alignment.
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function BulkImportOrganizationAddressesDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OrganizationAddressImportResult | null>(null);
  const { data: organizations } = useOrganizations(tenantId);
  const bulkImport = useBulkImportOrganizationAddresses(tenantId);

  function handleOpenChange(next: boolean) {
    if (next) {
      setFile(null);
      setResult(null);
    }
    setOpen(next);
  }

  function downloadCurrentOrganizations() {
    const rows = (organizations ?? []).map((organization) =>
      [csvCell(organization.id), csvCell(organization.legalName), csvCell(organization.address)].join(','),
    );
    const csv = ['id,legalName,address', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parothr-organization-addresses.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!file) {
      return;
    }
    try {
      const csv = await file.text();
      const imported = await bulkImport.mutateAsync({ csv });
      setResult(imported);
      if (imported.errors.length === 0) {
        toast.success(`${imported.updated} address${imported.updated === 1 ? '' : 'es'} updated`);
      } else {
        toast.warning(`${imported.updated} updated, ${imported.errors.length} row(s) need fixing`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to import addresses'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Bulk import addresses
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import organization addresses</DialogTitle>
          <DialogDescription>
            Download the current organizations, fill in the address column, and re-upload - useful when
            setting up several organizations&apos; addresses at once for payslips.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <Button type="button" variant="link" className="h-auto p-0" onClick={downloadCurrentOrganizations}>
              <Download className="size-4" />
              Download current organizations (CSV)
            </Button>

            <div className="space-y-2">
              <Label htmlFor="bulk-import-addresses-file">CSV file</Label>
              <input
                id="bulk-import-addresses-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
              <p className="text-xs text-muted-foreground">
                A blank address cell leaves that organization&apos;s address unchanged.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-medium">{result.updated}</span> address{result.updated === 1 ? '' : 'es'}{' '}
              updated successfully.
            </p>
            {result.errors.length > 0 && (
              <div className="max-h-64 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Row</TableHead>
                      <TableHead>Problem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.errors.map((rowError) => (
                      <TableRow key={rowError.row}>
                        <TableCell>{rowError.row}</TableCell>
                        <TableCell className="text-muted-foreground">{rowError.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {result.errors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Fix these rows in your file and re-upload - only the corrected rows need to be included.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          {!result ? (
            <Button onClick={handleImport} disabled={!file || bulkImport.isPending}>
              {bulkImport.isPending ? 'Importing…' : 'Import'}
            </Button>
          ) : (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
