import { z } from 'zod';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;

// Mirrors CreateEmployeeDto's validation rules (libs/employee/feature/src/lib/dto/create-employee.dto.ts).
export const employeeFormSchema = z.object({
  organizationId: z.string().uuid('Enter a valid organization ID'),
  organizationUnitId: z.string().uuid('Enter a valid unit ID').optional().or(z.literal('')),
  managerId: z.string().uuid('Enter a valid manager ID').optional().or(z.literal('')),
  employeeNumber: z
    .string()
    .regex(/^[A-Z]{2,6}-\d{4,}$/, 'Format like EMP-0001')
    .optional()
    .or(z.literal('')),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  personalEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: z.string().min(1, 'Hire date is required'),
  baseSalary: z.string().optional().or(z.literal('')),
  payFrequency: z.string().optional().or(z.literal('')),
  currency: z
    .string()
    .regex(/^[A-Z]{3}$/, '3-letter code, e.g. GHS')
    .optional()
    .or(z.literal('')),
  annualRentPaid: z.string().optional().or(z.literal('')),
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/, '2-letter code, e.g. GH'),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export const EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPES;
