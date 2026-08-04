import { applyKenyaPersonalRelief } from './kenya-personal-relief';

describe('applyKenyaPersonalRelief', () => {
  it('subtracts the flat relief from tax above it', () => {
    expect(applyKenyaPersonalRelief(10_000)).toBe(7_600);
  });

  it('floors at zero rather than going negative when tax is below the relief', () => {
    expect(applyKenyaPersonalRelief(1_000)).toBe(0);
  });

  it('floors at zero when tax exactly equals the relief', () => {
    expect(applyKenyaPersonalRelief(2_400)).toBe(0);
  });

  it('floors at zero when there is no tax at all', () => {
    expect(applyKenyaPersonalRelief(0)).toBe(0);
  });
});
