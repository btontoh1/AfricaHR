'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { useUpdateAttendanceLocation } from './queries';
import { attendanceLocationFormSchema, type AttendanceLocationFormValues } from './attendance-form-schema';
import { AddressSearchField } from './address-search-field';
import type { AttendanceLocation } from './types';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

function toFormValues(location: AttendanceLocation): AttendanceLocationFormValues {
  return {
    name: location.name,
    latitude: location.latitude,
    longitude: location.longitude,
    radiusMeters: String(location.radiusMeters),
  };
}

export function EditAttendanceLocationDialog({
  tenantId,
  location,
}: {
  tenantId: string;
  location: AttendanceLocation;
}) {
  const [open, setOpen] = useState(false);
  const updateLocation = useUpdateAttendanceLocation(tenantId, location.id);

  const form = useForm<AttendanceLocationFormValues>({
    resolver: zodResolver(attendanceLocationFormSchema),
    defaultValues: toFormValues(location),
  });

  function useCurrentLocation() {
    if (!('geolocation' in navigator)) {
      toast.error('Location is not available in this browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue('latitude', position.coords.latitude.toFixed(6));
        form.setValue('longitude', position.coords.longitude.toFixed(6));
      },
      () => toast.error('Failed to get your current location'),
    );
  }

  async function onSubmit(values: AttendanceLocationFormValues) {
    try {
      await updateLocation.mutateAsync({
        name: values.name,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        radiusMeters: Number(values.radiusMeters),
      });
      toast.success('Location updated');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update location'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset(toFormValues(location));
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit location</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AddressSearchField
              onSelect={(result) => {
                form.setValue('latitude', result.latitude.toFixed(6));
                form.setValue('longitude', result.longitude.toFixed(6));
              }}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input type="text" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input type="text" inputMode="decimal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="button" variant="outline" onClick={useCurrentLocation}>
              <MapPin className="size-4" />
              Use my current location
            </Button>
            <FormField
              control={form.control}
              name="radiusMeters"
              render={({ field }) => (
                <FormItem className="max-w-[10rem]">
                  <FormLabel>Radius (meters)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving…' : 'Save changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
