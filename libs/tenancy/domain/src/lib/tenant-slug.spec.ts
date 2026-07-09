import { isValidSlug, slugify } from './tenant-slug';

describe('isValidSlug', () => {
  it.each([
    ['acme-ghana', true],
    ['acme', true],
    ['ac', false], // too short
    ['Acme-Ghana', false], // uppercase
    ['acme_ghana', false], // underscore not allowed
    ['-acme', false], // leading hyphen
    ['acme-', false], // trailing hyphen
    ['acme--ghana', false], // double hyphen
    ['a'.repeat(64), false], // too long
  ])('%s -> %s', (slug, expected) => {
    expect(isValidSlug(slug)).toBe(expected);
  });
});

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Acme Ghana Ltd')).toBe('acme-ghana-ltd');
  });

  it('strips non-alphanumeric characters', () => {
    expect(slugify('Acme & Co. (Ghana)')).toBe('acme-co-ghana');
  });

  it('collapses repeated separators and trims edges', () => {
    expect(slugify('  --Acme---Ghana--  ')).toBe('acme-ghana');
  });

  it('produces a slug that passes isValidSlug', () => {
    expect(isValidSlug(slugify('Acme Ghana Ltd'))).toBe(true);
  });
});
