'use client';

import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkImportEmployees } from './queries';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import type { BulkImportResult } from './types';
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

// Mirrors BulkImportRowDto (libs/employee/feature/src/lib/dto/bulk-import-row.dto.ts) -
// only the core employee-record fields; organization unit, reporting
// manager, and family members stay manual edits after import (see that
// DTO's own comment for why).
const TEMPLATE_HEADER = [
  'employeeNumber',
  'firstName',
  'lastName',
  'dateOfBirth',
  'gender',
  'nationality',
  'phone',
  'personalEmail',
  'jobTitle',
  'employmentType',
  'hireDate',
  'baseSalary',
  'payFrequency',
  'currency',
  'countryCode',
];
const TEMPLATE_EXAMPLE_ROW = [
  '',
  'John',
  'Doe',
  '1990-01-15',
  'Male',
  'Ghanaian',
  '+233241234567',
  'john.doe@example.com',
  'Software Engineer',
  'FULL_TIME',
  '2024-01-01',
  '5000',
  'MONTHLY',
  'GHS',
  'GH',
];

function downloadTemplate() {
  const csv = [TEMPLATE_HEADER.join(','), TEMPLATE_EXAMPLE_ROW.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'parothr-employee-import-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function BulkImportEmployeesDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const bulkImport = useBulkImportEmployees(tenantId);

  function handleOpenChange(next: boolean) {
    if (next) {
      setOrganizationId('');
      setFile(null);
      setResult(null);
    }
    setOpen(next);
  }

  async function handleImport() {
    if (!organizationId || !file) {
      return;
    }
    try {
      const csv = await file.text();
      const imported = await bulkImport.mutateAsync({ organizationId, csv });
      setResult(imported);
      if (imported.errors.length === 0) {
        toast.success(`${imported.created} employee${imported.created === 1 ? '' : 's'} imported`);
      } else {
        toast.warning(`${imported.created} imported, ${imported.errors.length} row(s) need fixing`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to import employees'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Bulk import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk import employees</DialogTitle>
          <DialogDescription>
            Upload a CSV to create multiple employees at once - useful when onboarding a company&apos;s
            existing roster from another system.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <Button type="button" variant="link" className="h-auto p-0" onClick={downloadTemplate}>
              <Download className="size-4" />
              Download CSV template
            </Button>

            <div className="space-y-2">
              <Label>Organization</Label>
              <OrganizationPicker tenantId={tenantId} value={organizationId} onChange={setOrganizationId} />
              <p className="text-xs text-muted-foreground">Every employee in the file is created under this organization.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-import-file">CSV file</Label>
              <input
                id="bulk-import-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium"
              />
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-medium">{result.created}</span> employee{result.created === 1 ? '' : 's'}{' '}
              created successfully.
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
            <Button onClick={handleImport} disabled={!organizationId || !file || bulkImport.isPending}>
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
