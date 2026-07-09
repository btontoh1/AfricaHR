import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateTenantDto } from './create-tenant.dto';

async function validateDto(payload: Record<string, unknown>) {
  const dto = plainToInstance(CreateTenantDto, payload);
  return validate(dto);
}

describe('CreateTenantDto', () => {
  const valid = {
    name: 'Acme Ghana Ltd',
    country: 'GH',
    currency: 'GHS',
    timezone: 'Africa/Accra',
  };

  it('passes for a valid payload without an explicit slug', async () => {
    expect(await validateDto(valid)).toHaveLength(0);
  });

  it('rejects an uppercase slug', async () => {
    const errors = await validateDto({ ...valid, slug: 'Acme-Ghana' });
    expect(errors.some((e) => e.property === 'slug')).toBe(true);
  });

  it('rejects a country code that is not 2 letters', async () => {
    const errors = await validateDto({ ...valid, country: 'GHA' });
    expect(errors.some((e) => e.property === 'country')).toBe(true);
  });

  it('rejects a currency code that is not 3 letters', async () => {
    const errors = await validateDto({ ...valid, currency: 'GH' });
    expect(errors.some((e) => e.property === 'currency')).toBe(true);
  });

  it('rejects a missing name', async () => {
    const { name, ...rest } = valid;
    void name;
    const errors = await validateDto(rest);
    expect(errors.some((e) => e.property === 'name')).toBe(true);
  });
});
