import { z } from 'zod';

// Mirrors CreateAttendanceRecordDto (libs/attendance/feature/src/lib/dto/create-attendance-record.dto.ts).
export const createAttendanceRecordFormSchema = z.object({
  employeeId: z.string().uuid('Select an employee'),
  date: z.string().min(1, 'Date is required'),
  clockIn: z.string().optional().or(z.literal('')),
  clockOut: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type CreateAttendanceRecordFormValues = z.infer<typeof createAttendanceRecordFormSchema>;

// Mirrors UpdateAttendanceRecordDto (libs/attendance/feature/src/lib/dto/update-attendance-record.dto.ts).
export const updateAttendanceRecordFormSchema = z.object({
  clockIn: z.string().optional().or(z.literal('')),
  clockOut: z.string().optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type UpdateAttendanceRecordFormValues = z.infer<typeof updateAttendanceRecordFormSchema>;

// Mirrors UpsertAttendancePolicyDto (libs/attendance/feature/src/lib/dto/upsert-attendance-policy.dto.ts).
export const attendancePolicyFormSchema = z
  .object({
    standardDailyHours: z.string().min(1, 'Standard daily hours is required'),
    geofenceLatitude: z.string().optional().or(z.literal('')),
    geofenceLongitude: z.string().optional().or(z.literal('')),
    geofenceRadiusMeters: z.string().optional().or(z.literal('')),
    geofenceLocationName: z.string().max(200).optional().or(z.literal('')),
  })
  .refine(
    (values) => {
      const provided = [values.geofenceLatitude, values.geofenceLongitude, values.geofenceRadiusMeters].filter(
        (value) => value !== undefined && value !== '',
      );
      return provided.length === 0 || provided.length === 3;
    },
    {
      message: 'Set latitude, longitude, and radius together to enable geofencing, or leave all three blank to disable it',
      path: ['geofenceRadiusMeters'],
    },
  );

export type AttendancePolicyFormValues = z.infer<typeof attendancePolicyFormSchema>;
