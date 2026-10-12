'use client';

import { MapPin } from 'lucide-react';
import { useAttendanceLocations } from './queries';
import { EditAttendanceLocationDialog } from './edit-attendance-location-dialog';
import { DeleteAttendanceLocationDialog } from './delete-attendance-location-dialog';
import { getApiErrorMessage } from '@/lib/api-error';
import { TableCard } from '@/components/table-card';
import { EmptyState } from '@/components/empty-state';
import { TableSkeleton } from '@/components/loading-state';
import { ErrorState } from '@/components/error-state';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function AttendanceLocationsList({ tenantId }: { tenantId: string }) {
  const { data: locations, isLoading, isError, error } = useAttendanceLocations(tenantId);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (isError) {
    return <ErrorState message={getApiErrorMessage(error, 'Failed to load attendance locations')} />;
  }

  if (!locations || locations.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No locations yet"
        description="Add a work site above so clock-ins/outs show which location they're nearest to. This is informational only — employees can clock in from anywhere."
      />
    );
  }

  return (
    <TableCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Latitude</TableHead>
            <TableHead>Longitude</TableHead>
            <TableHead>Radius (m)</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">{location.name}</TableCell>
              <TableCell className="text-muted-foreground">{location.latitude}</TableCell>
              <TableCell className="text-muted-foreground">{location.longitude}</TableCell>
              <TableCell className="text-muted-foreground">{location.radiusMeters}</TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <EditAttendanceLocationDialog tenantId={tenantId} location={location} />
                  <DeleteAttendanceLocationDialog tenantId={tenantId} location={location} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableCard>
  );
}
