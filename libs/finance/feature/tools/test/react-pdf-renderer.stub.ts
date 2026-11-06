// @react-pdf/renderer ships ESM-only JS that Jest's ts-jest transform can't
// parse (see jest.config.cts's moduleNameMapper). Nothing under test ever
// exercises real PDF rendering - FinanceReportPdfService itself has no
// spec, and finance-reports.service.spec.ts always mocks it - so this
// stub only needs to satisfy the import, not behave like the real thing.
export const Document = 'Document';
export const Page = 'Page';
export const Text = 'Text';
export const View = 'View';
export const Image = 'Image';
export const StyleSheet = { create: (styles: unknown) => styles };
export async function renderToBuffer(): Promise<Buffer> {
  return Buffer.from('');
}
