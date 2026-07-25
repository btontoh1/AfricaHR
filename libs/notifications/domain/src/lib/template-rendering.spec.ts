import { renderTemplate } from './template-rendering';

describe('renderTemplate', () => {
  it('substitutes known {{variable}} placeholders', () => {
    expect(renderTemplate('Hello {{firstName}}, welcome to {{company}}!', {
      firstName: 'Ama',
      company: 'ParrotHR',
    })).toBe('Hello Ama, welcome to ParrotHR!');
  });

  it('tolerates whitespace inside the placeholder braces', () => {
    expect(renderTemplate('Hi {{ firstName }}', { firstName: 'Kojo' })).toBe('Hi Kojo');
  });

  it('leaves unknown placeholders untouched rather than blanking them', () => {
    expect(renderTemplate('Hi {{firstName}}, ref {{missing}}', { firstName: 'Ama' })).toBe(
      'Hi Ama, ref {{missing}}',
    );
  });

  it('returns the template unchanged when it has no placeholders', () => {
    expect(renderTemplate('Plain text', {})).toBe('Plain text');
  });
});
