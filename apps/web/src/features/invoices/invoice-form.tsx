'use client';

import { useRouter } from 'next/navigation';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { useSession } from '@/app/(app)/session-provider';
import { useCreateInvoice, useUpdateInvoice } from './queries';
import { invoiceFormSchema, previewInvoiceTotals, type InvoiceFormValues } from './invoice-form-schema';
import type { CustomerInvoice } from './types';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { CustomerPicker } from '@/features/customers/customer-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/format-currency';
import { ALL_CURRENCIES } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

function toFormValues(invoice?: CustomerInvoice): InvoiceFormValues {
  if (!invoice) {
    return {
      organizationId: '',
      customerId: '',
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      currency: '',
      notes: '',
      taxRate: '',
      lineItems: [{ description: '', quantity: '1', unitPrice: '' }],
    };
  }
  return {
    organizationId: invoice.organizationId,
    customerId: invoice.customerId,
    issueDate: invoice.issueDate.slice(0, 10),
    dueDate: invoice.dueDate.slice(0, 10),
    currency: invoice.currency,
    notes: invoice.notes ?? '',
    taxRate: invoice.taxRate,
    lineItems: invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  };
}

export function InvoiceForm({ tenantId, invoice }: { tenantId: string; invoice?: CustomerInvoice }) {
  const router = useRouter();
  const session = useSession();
  const isOrgAdmin = session.role === 'ORG_ADMIN';
  const isEditing = Boolean(invoice);
  const createInvoice = useCreateInvoice(tenantId);
  const updateInvoice = useUpdateInvoice(tenantId, invoice?.id ?? '');

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      ...toFormValues(invoice),
      organizationId: invoice?.organizationId ?? (isOrgAdmin ? (session.organizationId ?? '') : ''),
    },
  });

  const lineItemFields = useFieldArray({ control: form.control, name: 'lineItems' });
  const organizationId = form.watch('organizationId');
  const watchedLineItems = form.watch('lineItems');
  const watchedTaxRate = form.watch('taxRate');
  const watchedCurrency = form.watch('currency') || '—';
  const totals = previewInvoiceTotals(watchedLineItems, watchedTaxRate ?? '');

  async function onSubmit(values: InvoiceFormValues) {
    const lineItems = values.lineItems.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    }));
    const taxRate = values.taxRate ? Number(values.taxRate) : undefined;

    try {
      if (isEditing && invoice) {
        await updateInvoice.mutateAsync({
          customerId: values.customerId,
          issueDate: values.issueDate,
          dueDate: values.dueDate,
          currency: values.currency,
          notes: values.notes || undefined,
          taxRate,
          lineItems,
        });
        toast.success('Invoice updated');
        router.push(`/invoices/${invoice.id}`);
      } else {
        const created = await createInvoice.mutateAsync({
          organizationId: values.organizationId,
          customerId: values.customerId,
          issueDate: values.issueDate,
          dueDate: values.dueDate,
          currency: values.currency,
          notes: values.notes || undefined,
          // Create's taxRate has an OpenAPI `default: 0`, which
          // openapi-typescript's defaultNonNullable setting turns into a
          // required (non-optional) field - unlike Update, where it's
          // genuinely optional. 0 is also the correct value when the user
          // leaves the field blank.
          taxRate: taxRate ?? 0,
          lineItems,
        });
        toast.success('Invoice created');
        router.push(`/invoices/${created?.id}`);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, isEditing ? 'Failed to update invoice' : 'Failed to create invoice'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bill to</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="organizationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization</FormLabel>
                  <FormControl>
                    <OrganizationPicker
                      tenantId={tenantId}
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        form.setValue('customerId', '');
                      }}
                      disabled={isOrgAdmin || isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <FormControl>
                    <CustomerPicker
                      tenantId={tenantId}
                      organizationId={organizationId}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-4">
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ALL_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code} — {currency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="taxRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax rate % (optional)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} max={100} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItemFields.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_100px_140px_auto] sm:items-end">
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.description`}
                  render={({ field: descField }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Description</FormLabel>}
                      <FormControl>
                        <Input placeholder="Consulting services" {...descField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.quantity`}
                  render={({ field: qtyField }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Qty</FormLabel>}
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...qtyField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`lineItems.${index}.unitPrice`}
                  render={({ field: priceField }) => (
                    <FormItem>
                      {index === 0 && <FormLabel>Unit price</FormLabel>}
                      <FormControl>
                        <Input type="number" min={0} step="0.01" {...priceField} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => lineItemFields.remove(index)}
                  disabled={lineItemFields.fields.length === 1}
                  aria-label="Remove line item"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => lineItemFields.append({ description: '', quantity: '1', unitPrice: '' })}
            >
              <Plus className="size-4" />
              Add line item
            </Button>

            <div className="ml-auto max-w-xs space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal, watchedCurrency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(totals.taxAmount, watchedCurrency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>{formatCurrency(totals.total, watchedCurrency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea placeholder="Payment terms, thank-you note, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Create invoice'}
        </Button>
      </form>
    </Form>
  );
}
