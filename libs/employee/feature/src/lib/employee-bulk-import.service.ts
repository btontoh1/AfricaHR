import { HttpException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { assertOrganizationScope, RequestUser } from '@africahr/platform-auth';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { BulkImportRowDto } from './dto/bulk-import-row.dto';
import { BulkImportResultDto } from './dto/bulk-import-result.dto';

const REQUIRED_COLUMNS = ['firstName', 'lastName', 'jobTitle', 'employmentType', 'hireDate', 'countryCode'];

/**
 * Turns each CSV cell's "" (blank cell) into undefined - class-validator's
 * @IsOptional() only skips null/undefined, not an empty string, so a
 * blank-but-present cell would otherwise fail validation instead of being
 * treated as "not provided" the way an omitted JSON field would be.
 */
function blankToUndefined(record: Record<string, string>): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = value.trim() === '' ? undefined : value.trim();
  }
  return result;
}

@Injectable()
export class EmployeeBulkImportService {
  constructor(private readonly employees: EmployeeService) {}

  async import(
    tenantId: string,
    organizationId: string,
    csv: string,
    actor: RequestUser,
  ): Promise<BulkImportResultDto> {
    // Fail once, up front, instead of every one of N rows independently
    // hitting (and reporting) the same "not authorized for this org" error.
    assertOrganizationScope(actor, organizationId);

    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length > 0) {
      const missing = REQUIRED_COLUMNS.filter((column) => !(column in records[0]));
      if (missing.length > 0) {
        return {
          created: 0,
          errors: [{ row: 1, message: `CSV is missing required column(s): ${missing.join(', ')}` }],
        };
      }
    }

    const result: BulkImportResultDto = { created: 0, errors: [] };

    for (const [index, rawRecord] of records.entries()) {
      // +2: 1-indexed, plus the header row itself, so this matches the row
      // number a person would see counting lines in a spreadsheet.
      const row = index + 2;
      const record = blankToUndefined(rawRecord);

      const dto = plainToInstance(BulkImportRowDto, record);
      const validationErrors = await validate(dto, { whitelist: true });
      if (validationErrors.length > 0) {
        const message = validationErrors
          .flatMap((error) => Object.values(error.constraints ?? {}))
          .join('; ');
        result.errors.push({ row, message });
        continue;
      }

      const createDto: CreateEmployeeDto = {
        organizationId,
        employeeNumber: dto.employeeNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        dateOfBirth: dto.dateOfBirth,
        gender: dto.gender,
        nationality: dto.nationality,
        phone: dto.phone,
        personalEmail: dto.personalEmail,
        jobTitle: dto.jobTitle,
        employmentType: dto.employmentType,
        hireDate: dto.hireDate,
        baseSalary: dto.baseSalary,
        payFrequency: dto.payFrequency,
        currency: dto.currency,
        countryCode: dto.countryCode,
      };

      try {
        await this.employees.create(tenantId, createDto, actor);
        result.created += 1;
      } catch (error) {
        const message = error instanceof HttpException ? error.message : 'Failed to create this row';
        result.errors.push({ row, message });
      }
    }

    return result;
  }
}
