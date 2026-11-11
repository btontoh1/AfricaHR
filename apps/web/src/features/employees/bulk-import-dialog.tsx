'use client';

import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useBulkImportEmployees } from './queries';
import { COMPENSATION_TYPE_OPTIONS, EMPLOYMENT_TYPE_OPTIONS } from './employee-form-schema';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { AFRICAN_COUNTRIES } from '@/lib/african-countries';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  'compensationType',
  'hourlyRate',
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
  'SALARY',
  '',
  '5000',
  'MONTHLY',
  'GHS',
  'GH',
];

// A minimal template for an organization that only has a plain name list -
// jobTitle/employmentType/hireDate/countryCode are left out of the file
// entirely and instead come from the "default values" fields below, set
// once for the whole batch rather than filled in per row.
const NAMES_ONLY_TEMPLATE_HEADER = ['firstName', 'lastName'];
const NAMES_ONLY_TEMPLATE_EXAMPLE_ROW = ['John', 'Doe'];

function downloadCsv(filename: string, header: string[], exampleRow: string[]) {
  const csv = [header.join(','), exampleRow.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate() {
  downloadCsv('parothr-employee-import-template.csv', TEMPLATE_HEADER, TEMPLATE_EXAMPLE_ROW);
}

function downloadNamesOnlyTemplate() {
  downloadCsv('parothr-employee-import-names-only-template.csv', NAMES_ONLY_TEMPLATE_HEADER, NAMES_ONLY_TEMPLATE_EXAMPLE_ROW);
}

export function BulkImportEmployeesDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [defaultJobTitle, setDefaultJobTitle] = useState('');
  const [defaultEmploymentType, setDefaultEmploymentType] = useState<
    (typeof EMPLOYMENT_TYPE_OPTIONS)[number] | ''
  >('');
  const [defaultHireDate, setDefaultHireDate] = useState('');
  const [defaultCountryCode, setDefaultCountryCode] = useState('');
  const [defaultCompensationType, setDefaultCompensationType] = useState<
    (typeof COMPENSATION_TYPE_OPTIONS)[number] | ''
  >('');
  const [defaultHourlyRate, setDefaultHourlyRate] = useState('');
  const bulkImport = useBulkImportEmployees(tenantId);

  function handleOpenChange(next: boolean) {
    if (next) {
      setOrganizationId('');
      setFile(null);
      setResult(null);
      setDefaultJobTitle('');
      setDefaultEmploymentType('');
      setDefaultHireDate('');
      setDefaultCountryCode('');
      setDefaultCompensationType('');
      setDefaultHourlyRate('');
    }
    setOpen(next);
  }

  async function handleImport() {
    if (!organizationId || !file) {
      return;
    }
    try {
      const csv = await file.text();
      const defaults = {
        jobTitle: defaultJobTitle || undefined,
        employmentType: defaultEmploymentType || undefined,
        hireDate: defaultHireDate || undefined,
        countryCode: defaultCountryCode || undefined,
        compensationType: defaultCompensationType || undefined,
        hourlyRate: defaultHourlyRate ? Number(defaultHourlyRate) : undefined,
      };
      const hasAnyDefault = Object.values(defaults).some((value) => value !== undefined);
      const imported = await bulkImport.mutateAsync({
        organizationId,
        csv,
        ...(hasAnyDefault ? { defaults } : {}),
      });
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
            Upload a CSV to create multiple employees at once. Have a full roster exported from another
            system? Use the full template. Only have a plain list of names? Use the names-only template and
            set the default values below once for the whole batch.
          </DialogDescription>
        </DialogHeader>

        {!result && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <Button type="button" variant="link" className="h-auto justify-start p-0" onClick={downloadTemplate}>
                <Download className="size-4" />
                Download full CSV template
              </Button>
              <Button
                type="button"
                variant="link"
                className="h-auto justify-start p-0"
                onClick={downloadNamesOnlyTemplate}
              >
                <Download className="size-4" />
                Download names-only CSV template
              </Button>
            </div>

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

            <div className="space-y-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Default values (optional)</p>
                <p className="text-xs text-muted-foreground">
                  Applied to any row that leaves the matching column blank - a row with its own value always
                  wins. Fill these in if your file only has names.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-import-job-title">Job title</Label>
                  <input
                    id="bulk-import-job-title"
                    value={defaultJobTitle}
                    onChange={(event) => setDefaultJobTitle(event.target.value)}
                    placeholder="e.g. Staff"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Employment type</Label>
                  <Select
                    value={defaultEmploymentType || undefined}
                    onValueChange={(value) => setDefaultEmploymentType(value as typeof defaultEmploymentType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-import-hire-date">Hire date</Label>
                  <input
                    id="bulk-import-hire-date"
                    type="date"
                    value={defaultHireDate}
                    onChange={(event) => setDefaultHireDate(event.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={defaultCountryCode || undefined} onValueChange={setDefaultCountryCode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name} ({country.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Compensation type</Label>
                  <Select
                    value={defaultCompensationType || undefined}
                    onValueChange={(value) => setDefaultCompensationType(value as typeof defaultCompensationType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPENSATION_TYPE_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type === 'HOURLY' ? 'Hourly' : 'Salary'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {defaultCompensationType === 'HOURLY' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-import-hourly-rate">Hourly rate</Label>
                    <input
                      id="bulk-import-hourly-rate"
                      type="number"
                      min={0}
                      step="0.01"
                      value={defaultHourlyRate}
                      onChange={(event) => setDefaultHourlyRate(event.target.value)}
                      placeholder="e.g. 15"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
                    />
                  </div>
                )}
              </div>
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
