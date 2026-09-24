import { HttpException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { OrganizationService } from './organization.service';
import { BulkUpdateOrganizationAddressRowDto } from './dto/bulk-update-organization-address-row.dto';
import { OrganizationAddressImportResultDto } from './dto/organization-address-import-result.dto';

const REQUIRED_COLUMNS = ['id'];

/**
 * Turns each CSV cell's "" (blank cell) into undefined - class-validator's
 * @IsOptional() only skips null/undefined, not an empty string, so a
 * blank-but-present cell would otherwise fail validation instead of being
 * treated as "not provided" the way an omitted JSON field would be. A
 * blank address cell means "leave this organization's address unchanged",
 * not "clear it" - same convention as EmployeeBulkImportService.
 */
function blankToUndefined(record: Record<string, string>): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = value.trim() === '' ? undefined : value.trim();
  }
  return result;
}

/**
 * Bulk-updates the address of existing organizations from a CSV, keyed by
 * organization id - unlike EmployeeBulkImportService this doesn't create
 * new rows, so the CSV is expected to originate from
 * OrganizationService.listByTenant (see the web feature's "Download
 * current organizations" template) rather than being typed by hand.
 */
@Injectable()
export class OrganizationBulkImportService {
  constructor(private readonly organizations: OrganizationService) {}

  async updateAddresses(
    tenantId: string,
    csv: string,
    actorId?: string,
  ): Promise<OrganizationAddressImportResultDto> {
    const records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    if (records.length > 0) {
      const missing = REQUIRED_COLUMNS.filter((column) => !(column in records[0]));
      if (missing.length > 0) {
        return {
          updated: 0,
          errors: [{ row: 1, message: `CSV is missing required column(s): ${missing.join(', ')}` }],
        };
      }
    }

    const result: OrganizationAddressImportResultDto = { updated: 0, errors: [] };

    for (const [index, rawRecord] of records.entries()) {
      // +2: 1-indexed, plus the header row itself, so this matches the row
      // number a person would see counting lines in a spreadsheet.
      const row = index + 2;
      const record = blankToUndefined(rawRecord);

      const dto = plainToInstance(BulkUpdateOrganizationAddressRowDto, record);
      const validationErrors = await validate(dto, { whitelist: true });
      if (validationErrors.length > 0) {
        const message = validationErrors
          .flatMap((error) => Object.values(error.constraints ?? {}))
          .join('; ');
        result.errors.push({ row, message });
        continue;
      }

      if (dto.address === undefined) {
        // Nothing to change for this row.
        continue;
      }

      try {
        await this.organizations.update(tenantId, dto.id, { address: dto.address }, actorId);
        result.updated += 1;
      } catch (error) {
        const message = error instanceof HttpException ? error.message : 'Failed to update this row';
        result.errors.push({ row, message });
      }
    }

    return result;
  }
}
