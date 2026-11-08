'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { useCreateVendorPayment } from './queries';
import { useVendorBills } from '@/features/vendor-bills/queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { VendorPicker } from '@/features/vendors/vendor-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'MOBILE_MONEY', label: 'Mobile money' },
  { value: 'CARD', label: 'Card' },
  { value: 'OTHER', label: 'Other' },
] as const;

const PAYABLE_STATUSES = new Set(['APPROVED', 'OVERDUE', 'PARTIALLY_PAID']);

export function RecordPaymentDialog({
  tenantId,
  defaultVendorId,
}: {
  tenantId: string;
  defaultVendorId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [vendorId, setVendorId] = useState(defaultVendorId ?? '');
  const [currency, setCurrency] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]['value'] | ''>('');
  const [reference, setReference] = useState('');
  const [amountByBillId, setAmountByBillId] = useState<Record<string, string>>({});

  const createPayment = useCreateVendorPayment(tenantId);
  const { data: bills } = useVendorBills(tenantId, organizationId || undefined);

  const openBills = useMemo(
    () => (bills ?? []).filter((bill) => bill.vendorId === vendorId && PAYABLE_STATUSES.has(bill.status)),
    [bills, vendorId],
  );
  const currencies = useMemo(() => [...new Set(openBills.map((bill) => bill.currency))], [openBills]);
  const billsInCurrency = useMemo(
    () => openBills.filter((bill) => bill.currency === currency),
    [openBills, currency],
  );
  const total = Object.values(amountByBillId).reduce((sum, value) => sum + (Number(value) || 0), 0);

  function reset() {
    setOrganizationId('');
    setVendorId(defaultVendorId ?? '');
    setCurrency('');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setMethod('');
    setReference('');
    setAmountByBillId({});
  }

  async function handleSubmit() {
    const allocations = Object.entries(amountByBillId)
      .filter(([, value]) => Number(value) > 0)
      .map(([billId, value]) => ({ billId, amount: Number(value) }));

    if (allocations.length === 0) {
      toast.error('Allocate an amount to at least one bill');
      return;
    }
    if (!method) {
      toast.error('Select a payment method');
      return;
    }

    try {
      await createPayment.mutateAsync({
        organizationId,
        vendorId,
        paymentDate,
        currency,
        method,
        reference: reference || undefined,
        allocations,
      });
      toast.success(`Payment of ${formatCurrency(total, currency)} recorded`);
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to record payment'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          reset();
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Record payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record a vendor payment</DialogTitle>
          <DialogDescription>
            Allocate this payment across one or more of the vendor&apos;s open bills - it can cover several
            bills, or only part of one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Organization</Label>
              <OrganizationPicker
                tenantId={tenantId}
                value={organizationId}
                onChange={(value) => {
                  setOrganizationId(value);
                  setVendorId(defaultVendorId ?? '');
                  setCurrency('');
                  setAmountByBillId({});
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Vendor</Label>
              <VendorPicker
                tenantId={tenantId}
                organizationId={organizationId}
                value={vendorId}
                onChange={(value) => {
                  setVendorId(value);
                  setCurrency('');
                  setAmountByBillId({});
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(value) => {
                  setCurrency(value);
                  setAmountByBillId({});
                }}
                disabled={currencies.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={currencies.length === 0 ? 'No open bills' : 'Select currency'} />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment date</Label>
              <Input type="date" value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(value) => setMethod(value as typeof method)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reference (optional)</Label>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Transaction ref, cheque number, etc."
            />
          </div>

          {vendorId && currency && (
            <div className="space-y-2">
              <Label>Allocate to bills</Label>
              {billsInCurrency.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open bills for this vendor in {currency}.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Due date</TableHead>
                      <TableHead className="text-right">Balance due</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billsInCurrency.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.billNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{bill.dueDate.slice(0, 10)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCurrency(bill.balanceDue, bill.currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={0}
                            max={Number(bill.balanceDue)}
                            step="0.01"
                            className="ml-auto w-32 text-right"
                            value={amountByBillId[bill.id] ?? ''}
                            onChange={(event) =>
                              setAmountByBillId((prev) => ({ ...prev, [bill.id]: event.target.value }))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex justify-end text-sm font-medium">Total: {formatCurrency(total, currency)}</div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={createPayment.isPending || total <= 0}>
            {createPayment.isPending ? 'Recording…' : 'Record payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
