import { randomInt } from 'node:crypto';
import { HttpException, Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { parse } from 'csv-parse/sync';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { assertOrganizationScope, RequestUser } from '@africahr/platform-auth';
import { AppConfigService, deriveEncryptionKey, hashPinForLookup } from '@africahr/platform-core';
import { EmployeeRepository } from '@africahr/employee-data-access';
import { EmployeeService } from './employee.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { BulkImportRowDto } from './dto/bulk-import-row.dto';
import { BulkImportResultDto, BulkImportKioskPinDto } from './dto/bulk-import-result.dto';
import { BulkImportDefaultsDto } from './dto/bulk-import-defaults.dto';

// 6 digits (1,000,000 possible values), not 4 (10,000) - this is the
// batch-generation path, so it has to stay collision-free at the scale of
// a whole worksite's roster (hundreds to low thousands) without the retry
// loop below needing more than one or two attempts per employee. A
// manually-typed PIN (SetKioskPinControl) stays 4-6 digits - one admin
// picking one PIN at a time doesn't have this problem.
const GENERATED_PIN_DIGITS = 6;
function generateKioskPin(): string {
  return String(randomInt(0, 10 ** GENERATED_PIN_DIGITS)).padStart(GENERATED_PIN_DIGITS, '0');
}

const MAX_PIN_GENERATION_ATTEMPTS = 20;

// Only firstName/lastName must actually be columns in the CSV itself -
// jobTitle/employmentType/hireDate/countryCode can instead come from
// `defaults` (merged into each row below, before validation), for an
// organization that only has a plain name list and no per-employee value
// for those four fields.
const REQUIRED_COLUMNS = ['firstName', 'lastName'];
const DEFAULTABLE_COLUMNS = [
  'jobTitle',
  'employmentType',
  'hireDate',
  'countryCode',
  'compensationType',
  'hourlyRate',
] as const;

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

// defaults' values aren't all strings (hourlyRate is a number) - record's
// cells always start as strings (or undefined) straight from the CSV, but
// merging a numeric default in is fine: plainToInstance/class-transformer's
// Type(() => Number) below coerces either representation the same way.
type MergedRecord = Record<string, string | number | undefined>;

@Injectable()
export class EmployeeBulkImportService {
  private readonly pinLookupKey: Buffer;

  constructor(
    private readonly employees: EmployeeService,
    private readonly employeeRepository: EmployeeRepository,
    config: AppConfigService,
  ) {
    // Derived once at construction (Nest instantiates providers eagerly),
    // same posture as MFA_ENCRYPTION_KEY/PAYMENT_METHOD_ENCRYPTION_KEY.
    this.pinLookupKey = deriveEncryptionKey(config.kioskPinLookupSecret, 'KIOSK_PIN_LOOKUP_SECRET');
  }

  async import(
    tenantId: string,
    organizationId: string,
    csv: string,
    actor: RequestUser,
    defaults?: BulkImportDefaultsDto,
    assignKioskPins?: boolean,
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
    const kioskPins: BulkImportKioskPinDto[] = [];

    for (const [index, rawRecord] of records.entries()) {
      // +2: 1-indexed, plus the header row itself, so this matches the row
      // number a person would see counting lines in a spreadsheet.
      const row = index + 2;
      const record: MergedRecord = blankToUndefined(rawRecord);
      for (const column of DEFAULTABLE_COLUMNS) {
        record[column] ??= defaults?.[column];
      }

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
        compensationType: dto.compensationType,
        hourlyRate: dto.hourlyRate,
        countryCode: dto.countryCode,
      };

      try {
        const employee = await this.employees.create(tenantId, createDto, actor);
        result.created += 1;

        if (assignKioskPins) {
          const pin = await this.generateUniquePin(tenantId, employee.id);
          const clockInPinHash = await argon2.hash(pin);
          const clockInPinLookupHash = hashPinForLookup(pin, this.pinLookupKey);
          await this.employeeRepository.setClockInPinHash(tenantId, employee.id, clockInPinHash, clockInPinLookupHash);
          kioskPins.push({
            employeeId: employee.id,
            employeeNumber: employee.employeeNumber,
            firstName: employee.firstName,
            lastName: employee.lastName,
            pin,
          });
        }
      } catch (error) {
        const message = error instanceof HttpException ? error.message : 'Failed to create this row';
        result.errors.push({ row, message });
      }
    }

    if (kioskPins.length > 0) {
      result.kioskPins = kioskPins;
    }

    return result;
  }

  /**
   * Retries on a collision rather than ever handing out a duplicate PIN -
   * at 6 generated digits (1,000,000 possible values) this essentially
   * never retries more than once even for a multi-thousand-employee batch,
   * but it's a hard guarantee either way, not just a low-probability hope.
   */
  private async generateUniquePin(tenantId: string, employeeId: string): Promise<string> {
    for (let attempt = 0; attempt < MAX_PIN_GENERATION_ATTEMPTS; attempt++) {
      const pin = generateKioskPin();
      const lookupHash = hashPinForLookup(pin, this.pinLookupKey);
      const taken = await this.employeeRepository.isPinLookupHashTaken(tenantId, lookupHash, employeeId);
      if (!taken) {
        return pin;
      }
    }
    throw new Error('Could not generate a unique kiosk PIN after several attempts');
  }
}
