import { createElement as h, type ReactNode } from 'react';
import { Injectable } from '@nestjs/common';
import { Document, Page, renderToBuffer, StyleSheet, Text, View } from '@react-pdf/renderer';
import { FinanceOrganizationInfo } from '@africahr/finance-data-access';
import { BalanceSheetResponseDto } from './dto/balance-sheet-response.dto';
import { CashFlowResponseDto } from './dto/cash-flow-response.dto';
import { ProfitAndLossResponseDto } from './dto/profit-and-loss-response.dto';

// No .tsx/JSX here on purpose - the API's build pipeline (webpack via
// nx run api:build) has no JSX toolchain configured, same reasoning as
// invoicing's InvoicePdfService.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#1a1a1a' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  orgName: { fontSize: 14, fontWeight: 700 },
  orgAddress: { fontSize: 9, color: '#555555', marginTop: 2 },
  reportTitle: { fontSize: 18, fontWeight: 700, textAlign: 'right' },
  reportMeta: { fontSize: 10, color: '#555555', textAlign: 'right', marginTop: 4 },
  currencySection: { marginBottom: 20 },
  currencyHeading: { fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', color: '#555555' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottom: '0.5pt solid #dddddd',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginTop: 2,
    borderTop: '1pt solid #333333',
  },
  label: { fontSize: 10 },
  value: { fontSize: 10 },
  totalLabel: { fontSize: 11, fontWeight: 700 },
  totalValue: { fontSize: 11, fontWeight: 700 },
  footnote: { marginTop: 24, fontSize: 8, color: '#888888' },
});

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function renderHeader(
  organization: FinanceOrganizationInfo,
  title: string,
  meta: string,
): ReactNode {
  return h(
    View,
    { style: styles.headerRow },
    h(
      View,
      null,
      h(Text, { style: styles.orgName }, organization.legalName),
      organization.address ? h(Text, { style: styles.orgAddress }, organization.address) : null,
    ),
    h(
      View,
      null,
      h(Text, { style: styles.reportTitle }, title),
      h(Text, { style: styles.reportMeta }, meta),
    ),
  );
}

function renderRow(label: string, amount: number, currency: string): ReactNode {
  return h(
    View,
    { key: label, style: styles.row },
    h(Text, { style: styles.label }, label),
    h(Text, { style: styles.value }, formatMoney(amount, currency)),
  );
}

function renderTotalRow(label: string, amount: number, currency: string): ReactNode {
  return h(
    View,
    { style: styles.totalRow },
    h(Text, { style: styles.totalLabel }, label),
    h(Text, { style: styles.totalValue }, formatMoney(amount, currency)),
  );
}

const FOOTNOTE = h(
  Text,
  { style: styles.footnote },
  'Only reflects general-ledger activity actually posted - automatic postings from payroll and invoicing, plus any manual journal entries recorded.',
);

@Injectable()
export class FinanceReportPdfService {
  async renderProfitAndLoss(
    organization: FinanceOrganizationInfo,
    report: ProfitAndLossResponseDto,
  ): Promise<Buffer> {
    const meta = `${formatDate(report.from)} to ${formatDate(report.to)}`;
    const sections = report.byCurrency.map((byCurrency) =>
      h(
        View,
        { key: byCurrency.currency, style: styles.currencySection },
        h(Text, { style: styles.currencyHeading }, byCurrency.currency),
        renderRow('Revenue', byCurrency.totalRevenue, byCurrency.currency),
        renderRow('Expense', byCurrency.totalExpense, byCurrency.currency),
        renderTotalRow('Net Income', byCurrency.netIncome, byCurrency.currency),
      ),
    );
    const page = h(
      Page,
      { size: 'A4', style: styles.page },
      renderHeader(organization, 'Profit and Loss', meta),
      ...sections,
      FOOTNOTE,
    );
    return renderToBuffer(h(Document, null, page));
  }

  async renderCashFlow(organization: FinanceOrganizationInfo, report: CashFlowResponseDto): Promise<Buffer> {
    const meta = `${formatDate(report.from)} to ${formatDate(report.to)}`;
    const sections = report.byCurrency.map((byCurrency) =>
      h(
        View,
        { key: byCurrency.currency, style: styles.currencySection },
        h(Text, { style: styles.currencyHeading }, byCurrency.currency),
        renderTotalRow('Net Cash Change (Operating)', byCurrency.netCashChange, byCurrency.currency),
      ),
    );
    const page = h(
      Page,
      { size: 'A4', style: styles.page },
      renderHeader(organization, 'Cash Flow', meta),
      ...sections,
      FOOTNOTE,
    );
    return renderToBuffer(h(Document, null, page));
  }

  async renderBalanceSheet(
    organization: FinanceOrganizationInfo,
    report: BalanceSheetResponseDto,
  ): Promise<Buffer> {
    const meta = `As of ${formatDate(report.asOf)}`;
    const sections = report.byCurrency.map((byCurrency) =>
      h(
        View,
        { key: byCurrency.currency, style: styles.currencySection },
        h(Text, { style: styles.currencyHeading }, byCurrency.currency),
        renderRow('Assets', byCurrency.totalAssets, byCurrency.currency),
        renderRow('Liabilities', byCurrency.totalLiabilities, byCurrency.currency),
        renderTotalRow('Equity', byCurrency.totalEquity, byCurrency.currency),
      ),
    );
    const page = h(
      Page,
      { size: 'A4', style: styles.page },
      renderHeader(organization, 'Balance Sheet', meta),
      ...sections,
      h(
        Text,
        { style: styles.footnote },
        'Equity is retained earnings since inception (cumulative revenue minus expense) - there is no dedicated Equity account in the default chart of accounts.',
      ),
    );
    return renderToBuffer(h(Document, null, page));
  }
}
