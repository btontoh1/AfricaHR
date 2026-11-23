import { createElement as h } from 'react';
import { Injectable, Logger } from '@nestjs/common';
import { Document, Image, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import sharp from 'sharp';
import { StorageService } from '@africahr/platform-storage';
import { CustomerInvoiceWithDetails } from '@africahr/invoicing-data-access';

// No .tsx/JSX here on purpose - the API's build pipeline (webpack via
// nx run api:build) has no JSX toolchain configured (it's a NestJS
// backend, not a React app), so this uses React.createElement directly
// rather than introducing that as a new build-time dependency just for
// one PDF template.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  // Three slots - the organization's own logo, its name/address centered
  // between them, and an optional secondary mark (e.g. IATA) on the right.
  // Both logo slots keep their reserved width even when empty, so the
  // center identity block stays visually centered either way.
  logoBandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logoSlot: { width: 64, height: 64 },
  logo: { width: 64, height: 64, objectFit: 'contain' },
  orgIdentity: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  orgName: { fontSize: 14, fontWeight: 700, textAlign: 'center' },
  orgAddress: { fontSize: 8, color: '#555555', textAlign: 'center', marginTop: 2 },
  invoiceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingTop: 12,
    borderTop: '1pt solid #dddddd',
  },
  invoiceTitle: { fontSize: 20, fontWeight: 700 },
  invoiceMeta: { fontSize: 10, color: '#555555', textAlign: 'right', marginTop: 4 },
  section: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  label: { fontSize: 9, color: '#888888', marginBottom: 2, textTransform: 'uppercase' },
  value: { fontSize: 10, marginBottom: 8 },
  table: { marginBottom: 16 },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #333333',
    paddingBottom: 6,
    marginBottom: 6,
  },
  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottom: '0.5pt solid #dddddd' },
  colDescription: { flex: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colUnitPrice: { flex: 1.5, textAlign: 'right' },
  colAmount: { flex: 1.5, textAlign: 'right' },
  tableHeaderText: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#555555' },
  totals: { alignSelf: 'flex-end', width: 220, marginTop: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalsLabel: { fontSize: 10, color: '#555555' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTop: '1pt solid #333333',
  },
  grandTotalLabel: { fontSize: 12, fontWeight: 700 },
  grandTotalValue: { fontSize: 12, fontWeight: 700 },
  notes: { marginTop: 24, fontSize: 9, color: '#555555' },
  statusBadge: { fontSize: 9, textTransform: 'uppercase', color: '#555555' },
});

function formatMoney(amount: string, currency: string): string {
  return `${currency} ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: Date): string {
  return iso.toISOString().slice(0, 10);
}

@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);

  constructor(private readonly storage: StorageService) {}

  async render(invoice: CustomerInvoiceWithDetails): Promise<Buffer> {
    const [logoBytes, secondaryLogoBytes] = await Promise.all([
      this.safeGetLogoBytes(invoice.organization.logoStorageKey),
      this.safeGetLogoBytes(invoice.organization.secondaryLogoStorageKey),
    ]);

    const logoBand = h(
      View,
      { style: styles.logoBandRow },
      logoBytes ? h(Image, { src: logoBytes, style: styles.logo }) : h(View, { style: styles.logoSlot }),
      h(
        View,
        { style: styles.orgIdentity },
        h(Text, { style: styles.orgName }, invoice.organization.legalName),
        invoice.organization.address ? h(Text, { style: styles.orgAddress }, invoice.organization.address) : null,
      ),
      secondaryLogoBytes
        ? h(Image, { src: secondaryLogoBytes, style: styles.logo })
        : h(View, { style: styles.logoSlot }),
    );

    const invoiceTitleRow = h(
      View,
      { style: styles.invoiceTitleRow },
      h(Text, { style: styles.invoiceTitle }, 'INVOICE'),
      h(
        View,
        null,
        h(Text, { style: styles.invoiceMeta }, invoice.invoiceNumber),
        h(Text, { style: styles.statusBadge }, invoice.status),
      ),
    );

    const billTo = h(
      View,
      null,
      h(Text, { style: styles.label }, 'Bill To'),
      h(Text, { style: styles.value }, invoice.customer.name),
      invoice.customer.email ? h(Text, { style: styles.value }, invoice.customer.email) : null,
      invoice.customer.phone ? h(Text, { style: styles.value }, invoice.customer.phone) : null,
      invoice.customer.billingAddress ? h(Text, { style: styles.value }, invoice.customer.billingAddress) : null,
    );

    const dates = h(
      View,
      null,
      h(Text, { style: styles.label }, 'Issue Date'),
      h(Text, { style: styles.value }, formatDate(invoice.issueDate)),
      h(Text, { style: styles.label }, 'Due Date'),
      h(Text, { style: styles.value }, formatDate(invoice.dueDate)),
    );

    const tableHeader = h(
      View,
      { style: styles.tableHeaderRow },
      h(Text, { style: [styles.colDescription, styles.tableHeaderText] }, 'Description'),
      h(Text, { style: [styles.colQty, styles.tableHeaderText] }, 'Qty'),
      h(Text, { style: [styles.colUnitPrice, styles.tableHeaderText] }, 'Unit Price'),
      h(Text, { style: [styles.colAmount, styles.tableHeaderText] }, 'Amount'),
    );

    const rows = invoice.lineItems.map((item) =>
      h(
        View,
        { key: item.id, style: styles.tableRow },
        h(Text, { style: styles.colDescription }, item.description),
        h(Text, { style: styles.colQty }, item.quantity.toString()),
        h(Text, { style: styles.colUnitPrice }, formatMoney(item.unitPrice.toString(), invoice.currency)),
        h(Text, { style: styles.colAmount }, formatMoney(item.amount.toString(), invoice.currency)),
      ),
    );

    const totals = h(
      View,
      { style: styles.totals },
      h(
        View,
        { style: styles.totalsRow },
        h(Text, { style: styles.totalsLabel }, 'Subtotal'),
        h(Text, { style: styles.totalsLabel }, formatMoney(invoice.subtotal.toString(), invoice.currency)),
      ),
      h(
        View,
        { style: styles.totalsRow },
        h(Text, { style: styles.totalsLabel }, `Tax (${invoice.taxRate.toString()}%)`),
        h(Text, { style: styles.totalsLabel }, formatMoney(invoice.taxAmount.toString(), invoice.currency)),
      ),
      h(
        View,
        { style: styles.grandTotalRow },
        h(Text, { style: styles.grandTotalLabel }, 'Total'),
        h(Text, { style: styles.grandTotalValue }, formatMoney(invoice.total.toString(), invoice.currency)),
      ),
    );

    const notes = invoice.notes
      ? h(View, { style: styles.notes }, h(Text, { style: styles.label }, 'Notes'), h(Text, null, invoice.notes))
      : null;

    const page = h(
      Page,
      { size: 'A4', style: styles.page },
      logoBand,
      invoiceTitleRow,
      h(View, { style: styles.section }, billTo, dates),
      h(View, { style: styles.table }, tableHeader, ...rows),
      totals,
      notes,
    );

    const document = h(Document, null, page);
    return renderToBuffer(document);
  }

  // A missing/unreadable logo shouldn't block generating the invoice
  // itself - the PDF just renders without one, same "degrade, don't fail"
  // posture as PlatformDashboardService's storage/redis checks.
  private async safeGetLogoBytes(logoStorageKey: string | null): Promise<Buffer | null> {
    if (!logoStorageKey) {
      return null;
    }
    try {
      const raw = await this.storage.getObjectBytes(logoStorageKey);
      // Normalize to PNG - react-pdf's image resolver only recognizes
      // JPEG/PNG/SVG magic bytes, but RequestOrganizationLogoUploadDto also
      // allows WEBP, which it silently fails to render (no error, no
      // logo). Re-encoding here covers every allowed upload format.
      return await sharp(raw).png().toBuffer();
    } catch (error) {
      this.logger.warn(`Failed to load organization logo for PDF: ${(error as Error).message}`);
      return null;
    }
  }
}
