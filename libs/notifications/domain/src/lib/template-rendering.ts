// Simple {{key}} substitution. Unknown placeholders are left untouched
// rather than silently blanked — a typo'd variable name should read as a
// visible bug in the rendered text, not vanish.
export function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    return Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match;
  });
}
