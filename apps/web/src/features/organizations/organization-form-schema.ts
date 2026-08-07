import { z } from 'zod';

// Mirrors CreateOrganizationDto (libs/tenancy/feature/src/lib/dto/create-organization.dto.ts).
export const organizationFormSchema = z.object({
  legalName: z.string().min(2, 'At least 2 characters').max(200),
  tradingName: z.string().max(200).optional().or(z.literal('')),
  countryCode: z.string().regex(/^[A-Z]{2}$/, '2-letter code, e.g. GH'),
  registrationNumber: z.string().min(1, 'Registration number is required').max(100),
  taxIdentificationNumber: z.string().max(100).optional().or(z.literal('')),
});

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

// Mirrors CreateOrganizationUnitDto (libs/tenancy/feature/src/lib/dto/create-organization-unit.dto.ts).
export const organizationUnitFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z.string().min(1, 'Code is required').max(20),
  parentId: z.string().uuid('Enter a valid unit ID').optional().or(z.literal('')),
});

export type OrganizationUnitFormValues = z.infer<typeof organizationUnitFormSchema>;

// Mirrors UpdateOrganizationUnitDto (libs/tenancy/feature/src/lib/dto/update-organization-unit.dto.ts).
export const editOrganizationUnitFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  code: z.string().min(1, 'Code is required').max(20),
});

export type EditOrganizationUnitFormValues = z.infer<typeof editOrganizationUnitFormSchema>;
