import dayjs from 'dayjs';
import { formatMoney } from './moneyFormat.js';

const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatMeasure = (value, { blankOnZero = false } = {}) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  if (blankOnZero && number === 0) return '';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(number);
};

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

const itemColumnStyles = {
  index: 'width:30px;text-align:center;',
  name: 'width:38%;text-align:left;overflow-wrap:anywhere;',
  unit: 'width:44px;text-align:center;',
  qty: 'width:56px;text-align:center;',
  dimension: 'width:44px;text-align:center;',
  areaQty: 'width:66px;text-align:right;',
  money: 'width:92px;text-align:right;',
  total: 'width:100px;text-align:right;',
};

export const buildItemsHtml = (items = [], products = []) => {
  const rows = items
    .map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      const name = product ? product.name : item.name || 'Sản phẩm';
      const previousItem = items[index - 1];
      const previousProduct = previousItem
        ? products.find((p) => p.id === previousItem.productId)
        : null;
      const previousName = previousProduct
        ? previousProduct.name
        : previousItem?.name || 'Sản phẩm';
      const currentProductKey =
        item.productId || (product || item.name ? name : '');
      const previousProductKey =
        previousItem?.productId ||
        (previousProduct || previousItem?.name ? previousName : '');
      const isSameAsPrevious = Boolean(
        previousItem &&
          currentProductKey &&
          previousProductKey &&
          currentProductKey === previousProductKey
      );
      const unit = product?.unit || '';
      const qty = Number(item.qty || 0);
      const length = Number(item.length || 0);
      const width = Number(item.width || 0);
      const hasDimensions = length > 0 && width > 0;
      const qtyDisplay = formatMeasure(qty, { blankOnZero: true });
      const lengthDisplay = hasDimensions
        ? formatMeasure(length, { blankOnZero: true })
        : '';
      const widthDisplay = hasDimensions
        ? formatMeasure(width, { blankOnZero: true })
        : '';
      const areaQty = hasDimensions ? qty * length * width : 0;
      const areaQtyDisplay = hasDimensions
        ? formatMeasure(areaQty, { blankOnZero: true })
        : '';
      const note = item.lineNote || '';
      const noteCell = note
        ? `<div class="item-note">${escapeHtml(note)}</div>`
        : '';
      const nameCell = isSameAsPrevious
        ? ''
        : `<div class="item-name" style="font-weight:500;color:#444;">${escapeHtml(name)}</div>`;
      return `
        <tr>
          <td style="${itemColumnStyles.index}">${index + 1}</td>
          <td style="${itemColumnStyles.name}">
            ${nameCell}
            ${noteCell}
          </td>
          <td style="${itemColumnStyles.unit}">${escapeHtml(unit)}</td>
          <td style="${itemColumnStyles.qty}">${qtyDisplay}</td>
          <td style="${itemColumnStyles.dimension}">${lengthDisplay}</td>
          <td style="${itemColumnStyles.dimension}">${widthDisplay}</td>
          <td style="${itemColumnStyles.areaQty}">${areaQtyDisplay}</td>
          <td style="${itemColumnStyles.money}">${formatMoney(item.unitPrice)}</td>
          <td style="${itemColumnStyles.total}">${formatMoney(item.lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="items">
      <thead>
        <tr>
          <th style="${itemColumnStyles.index}">TT</th>
          <th style="${itemColumnStyles.name}">Tên hàng</th>
          <th style="${itemColumnStyles.unit}">ĐVT</th>
          <th style="${itemColumnStyles.qty}">SL</th>
          <th style="${itemColumnStyles.dimension}">D</th>
          <th style="${itemColumnStyles.dimension}">R</th>
          <th style="${itemColumnStyles.areaQty}">M2</th>
          <th style="${itemColumnStyles.money}">Đơn giá</th>
          <th style="${itemColumnStyles.total}">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
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
    '{{customer.debt}}': formatMoney(customerDebt),
    '{{items}}': itemsHtml,
    '{{items.count}}': String(itemsCount),
    '{{items.qty}}': totalQtyLabel,
    '{{total}}': formatMoney(invoiceTotal),
    '{{paid}}': formatMoney(paid),
    '{{paid.text}}': paid > 0 ? formatMoney(paid) : '-',
    '{{debt}}': formatMoney(debt),
    '{{grand.total}}': formatMoney(grandTotal),
    '{{remaining}}': formatMoney(remaining),
    '{{date}}': dayjs(invoice.date).format('DD/MM/YYYY'),
    '{{note}}': formatTemplateText(resolvedNote),
    '{{invoice.note}}': formatTemplateText(persistedNote),
    '{{print.note}}': formatTemplateText(printNote),
    '{{staff}}': staff,
    '{{shop.name}}': settings.shopName || '',
    '{{shop.phone}}': settings.shopPhone || '',
    '{{shop.address}}': settings.shopAddress || '',
  };

  let html = template || '';
  Object.entries(replacements).forEach(([key, value]) => {
    html = html.replaceAll(key, value);
  });

  return applyInvoiceFontSizeOverride(html);
};
