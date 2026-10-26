import dayjs from 'dayjs';
import { buildEinvoicePrintFields } from '../features/einvoice/domain/printFields.js';
import { escapeHtml } from './htmlEscape.js';
import { formatMoney, formatRoundedMoney } from './moneyFormat.js';
import { buildItemsHtml } from './printItems.js';

export { buildItemsHtml } from './printItems.js';

const formatTemplateText = (value) =>
  escapeHtml(value).replaceAll('\n', '<br />');

const invoiceFontSizeOverride = `
<style>
  .invoice { font-size: 14px; }
  .logo-box, .qr-box { font-size: 12px; }
  .shop-name { font-size: 22px; }
  .shop-line, .meta, .summary { font-size: 14px; }
  .title { font-size: 18px; }
  table.items { font-size: 13px; }
  table.items .item-note { font-size: 11px; }
  .summary-row.total { font-size: 15px; }
  .invoice-note { font-size: 13px; }
  .policy { font-size: 12px; }
  .sign-title { font-size: 15px; }
  .sign-sub { font-size: 13px; }
  .footer { font-size: 11px; }
</style>
`;

const applyInvoiceFontSizeOverride = (html) => {
  if (html.includes('data-invoice-font-size-override')) return html;
  const override = invoiceFontSizeOverride.replace(
    '<style>',
    '<style data-invoice-font-size-override>'
  );
  if (html.includes('</style>')) {
    return html.replace('</style>', `</style>${override}`);
  }
  return `${override}${html}`;
};

export const renderInvoiceTemplate = ({
  template,
  invoice,
  customer,
  payments,
  products,
  settings,
}) => {
  const items = invoice.items || [];
  const itemsCount = items.length;
  const totalQty = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalQtyLabel = Number.isFinite(totalQty) ? totalQty.toFixed(1) : '0.0';
  const paid = (payments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );
  const invoiceTotal = Number(invoice.total || 0);
  const debt = invoiceTotal - paid;
  const itemsHtml = buildItemsHtml(items, products || []);
  const customerDebt = Number(invoice.customerDebt || 0);
  const grandTotal = invoiceTotal + customerDebt;
  const remaining = grandTotal - paid;
  const staff = invoice.staff || 'admin';
  const persistedNote = invoice.note || '';
  const printNote = invoice.printNote || '';
  const resolvedNote = printNote || persistedNote;

  const replacements = {
    '{{invoice.code}}': invoice.code || '',
    '{{customer.name}}': customer?.name || 'Khách lẻ',
    '{{customer.phone}}': customer?.phone || '',
    '{{customer.address}}': customer?.address || '',
    '{{customer.debt}}': formatRoundedMoney(customerDebt),
    '{{items}}': itemsHtml,
    '{{items.count}}': String(itemsCount),
    '{{items.qty}}': totalQtyLabel,
    '{{total}}': formatRoundedMoney(invoiceTotal),
    '{{paid}}': formatMoney(paid),
    '{{paid.text}}': paid > 0 ? formatMoney(paid) : '-',
    '{{debt}}': formatMoney(debt),
    '{{grand.total}}': formatRoundedMoney(grandTotal),
    '{{remaining}}': formatRoundedMoney(remaining),
    '{{date}}': dayjs(invoice.date).format('DD/MM/YYYY'),
    '{{note}}': formatTemplateText(resolvedNote),
    '{{invoice.note}}': formatTemplateText(persistedNote),
    '{{print.note}}': formatTemplateText(printNote),
    '{{staff}}': staff,
    '{{shop.name}}': settings.shopName || '',
    '{{shop.phone}}': settings.shopPhone || '',
    '{{shop.address}}': settings.shopAddress || '',
    ...buildEinvoicePrintFields(invoice, settings),
  };

  let html = template || '';
  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replaceAll(key, value);
  });

  return applyInvoiceFontSizeOverride(html);
};
