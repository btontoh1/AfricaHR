import { NotFoundException } from '@nestjs/common';
import { OrganizationBulkImportService } from './organization-bulk-import.service';
import { OrganizationService } from './organization.service';

const ORG_1 = '11111111-1111-4111-8111-111111111111';
const ORG_2 = '22222222-2222-4222-8222-222222222222';

describe('OrganizationBulkImportService', () => {
  let service: OrganizationBulkImportService;
  let organizations: jest.Mocked<OrganizationService>;

  beforeEach(() => {
    organizations = { update: jest.fn() } as unknown as jest.Mocked<OrganizationService>;
    service = new OrganizationBulkImportService(organizations);
  });

  it('updates the address for every valid row and reports nothing failed', async () => {
    organizations.update.mockResolvedValue({ id: ORG_1 } as never);
    const csv = [
      'id,address',
      `${ORG_1},"12 Independence Ave, Accra"`,
      `${ORG_2},"45 Liberation Rd, Kumasi"`,
    ].join('\n');

    const result = await service.updateAddresses('tenant-1', csv, 'admin-1');

    expect(result).toEqual({ updated: 2, errors: [] });
    expect(organizations.update).toHaveBeenNthCalledWith(
      1,
      'tenant-1',
      ORG_1,
      { address: '12 Independence Ave, Accra' },
      'admin-1',
    );
  });

  it('treats a blank address cell as "no change", not an error', async () => {
    const csv = ['id,address', `${ORG_1},`].join('\n');

    const result = await service.updateAddresses('tenant-1', csv, 'admin-1');

    expect(result).toEqual({ updated: 0, errors: [] });
    expect(organizations.update).not.toHaveBeenCalled();
  });

  it('reports a validation error for an invalid id without aborting the batch', async () => {
    organizations.update.mockResolvedValue({ id: ORG_2 } as never);
    const csv = ['id,address', 'not-a-uuid,Some address', `${ORG_2},Some other address`].join('\n');

    const result = await service.updateAddresses('tenant-1', csv, 'admin-1');

    expect(result.updated).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(organizations.update).toHaveBeenCalledTimes(1);
  });

  it('captures an update-time failure (e.g. unknown id) as a row error, not a thrown exception', async () => {
    organizations.update.mockRejectedValue(new NotFoundException(`Organization "${ORG_1}" not found`));
    const csv = ['id,address', `${ORG_1},Some address`].join('\n');

    const result = await service.updateAddresses('tenant-1', csv, 'admin-1');

    expect(result.updated).toBe(0);
    expect(result.errors).toEqual([{ row: 2, message: `Organization "${ORG_1}" not found` }]);
  });

  it('reports one error for a missing required column instead of one per row', async () => {
    const csv = ['address', 'Some address'].join('\n');

    const result = await service.updateAddresses('tenant-1', csv, 'admin-1');

    expect(result.updated).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('id');
    expect(organizations.update).not.toHaveBeenCalled();
  });
});
