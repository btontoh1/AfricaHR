'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MapPin, Plus } from 'lucide-react';
import { useCreateAttendanceLocation } from './queries';
import { attendanceLocationFormSchema, type AttendanceLocationFormValues } from './attendance-form-schema';
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

const EMPTY_VALUES: AttendanceLocationFormValues = {
  name: '',
  latitude: '',
  longitude: '',
  radiusMeters: '150',
};

export function CreateAttendanceLocationDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false);
  const createLocation = useCreateAttendanceLocation(tenantId);

  const form = useForm<AttendanceLocationFormValues>({
    resolver: zodResolver(attendanceLocationFormSchema),
    defaultValues: EMPTY_VALUES,
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
      await createLocation.mutateAsync({
        name: values.name,
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        radiusMeters: Number(values.radiusMeters),
      });
      toast.success('Location added');
      setOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to add location'));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset(EMPTY_VALUES);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add location
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add attendance location</DialogTitle>
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
                    <Input placeholder="East Legon Office" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                {form.formState.isSubmitting ? 'Adding…' : 'Add location'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
