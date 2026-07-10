'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useCreateRequisition } from './queries';
import {
  createRequisitionFormSchema,
  EMPLOYMENT_TYPE_OPTIONS,
  type CreateRequisitionFormValues,
} from './recruitment-form-schema';
import { OrganizationPicker } from '@/features/organizations/organization-picker';
import { OrganizationUnitPicker } from '@/features/organizations/organization-unit-picker';
import { EmployeePicker } from '@/features/employees/employee-picker';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CreateRequisitionForm({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const createRequisition = useCreateRequisition(tenantId);

  const form = useForm<CreateRequisitionFormValues>({
    resolver: zodResolver(createRequisitionFormSchema),
    defaultValues: {
      organizationId: '',
      organizationUnitId: '',
      hiringManagerId: '',
      title: '',
      description: '',
      employmentType: 'FULL_TIME',
      openings: '1',
      targetHireDate: '',
    },
  });

  const organizationId = form.watch('organizationId');

  async function onSubmit(values: CreateRequisitionFormValues) {
    try {
      const requisition = await createRequisition.mutateAsync({
        organizationId: values.organizationId,
        organizationUnitId: values.organizationUnitId ? values.organizationUnitId : undefined,
        hiringManagerId: values.hiringManagerId ? values.hiringManagerId : undefined,
        title: values.title,
        description: values.description ? values.description : undefined,
        employmentType: values.employmentType,
        openings: Number(values.openings),
        targetHireDate: values.targetHireDate ? values.targetHireDate : undefined,
      });
      toast.success('Job requisition created');
      router.push(`/recruitment/requisitions/${requisition.id}`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create job requisition'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New job requisition</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                          form.setValue('organizationUnitId', '');
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizationUnitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization unit (optional)</FormLabel>
                    <FormControl>
                      <OrganizationUnitPicker
                        tenantId={tenantId}
                        organizationId={organizationId}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="employmentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EMPLOYMENT_TYPE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.replace('_', ' ')}
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
                name="openings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Openings</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetHireDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target hire date (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="hiringManagerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hiring manager (optional)</FormLabel>
                  <FormControl>
                    <EmployeePicker tenantId={tenantId} value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Creating…' : 'Create requisition'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
