import { z } from 'zod';

// Mirrors UpdateEmployeeDto — the backend only allows changing these
// fields after creation (libs/employee/feature/src/lib/dto/update-employee.dto.ts).
export const updateEmployeeFormSchema = z.object({
  organizationUnitId: z.string().uuid('Enter a valid unit ID').optional().or(z.literal('')),
  managerId: z.string().uuid('Enter a valid manager ID').optional().or(z.literal('')),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  baseSalary: z.string().optional().or(z.literal('')),
  payFrequency: z.string().optional().or(z.literal('')),
});

export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeFormSchema>;
