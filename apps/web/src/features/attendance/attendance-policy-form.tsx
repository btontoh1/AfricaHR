'use client';

import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin } from 'lucide-react';
import { useAttendancePolicy, useUpsertAttendancePolicy } from './queries';
import {
  attendancePolicyFormSchema,
  type AttendancePolicyFormValues,
} from './attendance-form-schema';
import type { AttendancePolicy } from './types';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CardSkeleton } from '@/components/loading-state';

function PolicyForm({
  tenantId,
  defaultValues,
  notConfiguredYet,
}: {
  tenantId: string;
  defaultValues: AttendancePolicyFormValues;
  notConfiguredYet: boolean;
}) {
  const upsertPolicy = useUpsertAttendancePolicy(tenantId);

  const form = useForm<AttendancePolicyFormValues>({
    resolver: zodResolver(attendancePolicyFormSchema),
    defaultValues,
  });

  async function onSubmit(values: AttendancePolicyFormValues) {
    try {
      await upsertPolicy.mutateAsync({
        standardDailyHours: Number(values.standardDailyHours),
        geofenceLatitude: values.geofenceLatitude ? Number(values.geofenceLatitude) : undefined,
        geofenceLongitude: values.geofenceLongitude ? Number(values.geofenceLongitude) : undefined,
        geofenceRadiusMeters: values.geofenceRadiusMeters ? Number(values.geofenceRadiusMeters) : undefined,
      });
      toast.success('Attendance policy saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save attendance policy'));
    }
  }

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      toast.error('Location is not available in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('geofenceLatitude', position.coords.latitude.toFixed(6));
        form.setValue('geofenceLongitude', position.coords.longitude.toFixed(6));
      },
      () => toast.error('Failed to get your current location'),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance policy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {notConfiguredYet && (
          <p className="text-sm text-muted-foreground">
            No attendance policy configured yet — set the standard daily hours below. Hours
            worked beyond this threshold count as overtime.
          </p>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
            <FormField
              control={form.control}
              name="standardDailyHours"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Standard daily hours</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.5" className="w-32" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3 border-t pt-4">
              <div>
                <h3 className="text-sm font-medium">Work-site geofence (optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Set a location and radius to flag clock-ins/outs made from elsewhere for review —
                  device GPS can drift, so this never blocks the employee, it just marks the record.
                  Leave all three fields blank to disable geofencing.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <FormField
                  control={form.control}
                  name="geofenceLatitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Latitude</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" className="w-36" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="geofenceLongitude"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Longitude</FormLabel>
                      <FormControl>
                        <Input type="text" inputMode="decimal" className="w-36" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="geofenceRadiusMeters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Radius (meters)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} className="w-32" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" onClick={useCurrentLocation}>
                  <MapPin className="size-4" />
                  Use my current location
                </Button>
              </div>
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function defaultValuesFromPolicy(policy?: AttendancePolicy): AttendancePolicyFormValues {
  return {
    standardDailyHours: policy?.standardDailyHours ?? '',
    geofenceLatitude: policy?.geofenceLatitude ?? '',
    geofenceLongitude: policy?.geofenceLongitude ?? '',
    geofenceRadiusMeters: policy?.geofenceRadiusMeters != null ? String(policy.geofenceRadiusMeters) : '',
  };
}

export function AttendancePolicyForm({ tenantId }: { tenantId: string }) {
  const { data: policy, isLoading, isError } = useAttendancePolicy(tenantId);

  if (isLoading) {
    return <CardSkeleton />;
  }

  return (
    <PolicyForm
      tenantId={tenantId}
      defaultValues={defaultValuesFromPolicy(policy)}
      notConfiguredYet={isError}
    />
  );
}
