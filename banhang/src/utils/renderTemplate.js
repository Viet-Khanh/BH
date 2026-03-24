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

const formatTemplateText = (value) => escapeHtml(value).replaceAll('\n', '<br />');

export const buildItemsHtml = (items = [], products = []) => {
  const rows = items
    .map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      const name = product ? product.name : 'Sản phẩm';
      const code = product?.code || '';
      const unit = product?.unit || '';
      const qty = Number(item.qty || 0);
      const length = Number(item.length || 0);
      const width = Number(item.width || 0);
      const hasDimensions = length > 0 && width > 0;
      const qtyDisplay = hasDimensions ? formatMeasure(qty, { blankOnZero: true }) : '';
      const lengthDisplay = hasDimensions ? formatMeasure(length, { blankOnZero: true }) : '';
      const widthDisplay = hasDimensions ? formatMeasure(width, { blankOnZero: true }) : '';
      const areaQty = hasDimensions ? qty * length * width : qty;
      const areaQtyDisplay = formatMeasure(areaQty, { blankOnZero: true });
      const note = item.lineNote || '';
      const noteCell = note ? `<div class="item-note">${escapeHtml(note)}</div>` : '';
      return `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div><strong>${escapeHtml(name)}</strong></div>
            ${code ? `<div class="item-code">${escapeHtml(code)}</div>` : ''}
            ${noteCell}
          </td>
          <td>${escapeHtml(unit)}</td>
          <td>${qtyDisplay}</td>
          <td>${lengthDisplay}</td>
          <td>${widthDisplay}</td>
          <td>${areaQtyDisplay}</td>
          <td>${formatMoney(item.unitPrice)}</td>
          <td>${formatMoney(item.lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="items">
      <thead>
        <tr>
          <th>TT</th>
          <th>Tên hàng</th>
          <th>ĐVT</th>
          <th>Số lượng</th>
          <th>D</th>
          <th>R</th>
          <th>SL / M2</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
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
  const paid = (payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
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

  return html;
};
