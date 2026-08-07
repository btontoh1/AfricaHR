import { z } from 'zod';

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const;
const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'] as const;

// Mirrors FamilyMemberDto (libs/employee/feature/src/lib/dto/family-member.dto.ts).
const familyMemberFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  dateOfBirth: z.string().optional().or(z.literal('')),
});

// Mirrors UpdateEmployeeDto (libs/employee/feature/src/lib/dto/update-employee.dto.ts).
export const updateEmployeeFormSchema = z.object({
  organizationUnitId: z.string().uuid('Enter a valid unit ID').optional().or(z.literal('')),
  managerId: z.string().uuid('Enter a valid manager ID').optional().or(z.literal('')),
  userId: z.string().uuid('Select a user').optional().or(z.literal('')),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.enum(GENDERS).optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  personalEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  parents: z.array(familyMemberFormSchema),
  children: z.array(familyMemberFormSchema),
  jobTitle: z.string().min(1, 'Job title is required').max(200),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  hireDate: z.string().min(1, 'Hire date is required'),
  baseSalary: z.string().optional().or(z.literal('')),
  payFrequency: z.string().optional().or(z.literal('')),
  annualRentPaid: z.string().optional().or(z.literal('')),
  countryCode: z.string().regex(/^[A-Z]{2}$/, '2-letter code, e.g. GH'),
});

export type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeFormSchema>;

export const UPDATE_EMPLOYMENT_TYPE_OPTIONS = EMPLOYMENT_TYPES;
export const UPDATE_GENDER_OPTIONS = GENDERS;
