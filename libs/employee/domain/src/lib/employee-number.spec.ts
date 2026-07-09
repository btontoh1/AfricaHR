import { formatEmployeeNumber, isValidEmployeeNumber } from './employee-number';

describe('formatEmployeeNumber', () => {
  it('pads the sequence to 4 digits with the default prefix', () => {
    expect(formatEmployeeNumber(7)).toBe('EMP-0007');
  });

  it('does not truncate a sequence longer than 4 digits', () => {
    expect(formatEmployeeNumber(12345)).toBe('EMP-12345');
  });

  it('supports a custom prefix', () => {
    expect(formatEmployeeNumber(3, 'ACM')).toBe('ACM-0003');
  });

  it('produces a value that passes isValidEmployeeNumber', () => {
    expect(isValidEmployeeNumber(formatEmployeeNumber(7))).toBe(true);
  });
});

describe('isValidEmployeeNumber', () => {
  it.each([
    ['EMP-0001', true],
    ['ACM-1234', true],
    ['emp-0001', false], // must be uppercase
    ['E-0001', false], // prefix too short
    ['EMP0001', false], // missing hyphen
    ['EMP-1', false], // fewer than 4 digits
  ])('%s -> %s', (value, expected) => {
    expect(isValidEmployeeNumber(value)).toBe(expected);
  });
});
