// Sales receipt for 58 mm roll paper (printable width ≈ 48 mm, ~32 characters).
import dayjs from 'dayjs';
import { isWalkInCustomer } from '../einvoice/domain/buyerRequest.js';
import { escapeHtml } from '../../utils/htmlEscape.js';
import { getLineAmount, getMeasuredQty } from '../../utils/lineMeasure.js';
import { formatMeasure } from '../../utils/measureFormat.js';
import { formatMoney } from '../../utils/moneyFormat.js';
import { getItemUnitName } from '../../utils/productUnits.js';

const STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body { width: 48mm; margin: 0 5mm; padding: 2mm 0;
    font: 12px/1.35 Arial, 'Helvetica Neue', sans-serif;
    font-variant-numeric: tabular-nums; }
  .center { text-align: center; }
  .shop { font-size: 14px; font-weight: 700; text-transform: uppercase; }
  .sep { border-top: 1px dashed #000; margin: 4px 0; }
  .row { display: flex; justify-content: space-between; gap: 4px; }
  .row > span:last-child { text-align: right; white-space: nowrap; }
  .name { font-weight: 700; overflow-wrap: anywhere; }
  .line-note { font-size: 11px; font-style: italic; }
  .total { font-size: 15px; font-weight: 700; }
  .small { font-size: 11px; }
`;

const text = (value) => escapeHtml(value).replaceAll('\n', '<br />');

const row = (label, value, className = 'row') =>
  `<div class="${className}"><span>${label}</span><span>${value}</span></div>`;

const buildShopHtml = (settings = {}) =>
  [
    settings.shopName && `<div class="shop">${text(settings.shopName)}</div>`,
    settings.shopPhone && `<div>ĐT: ${text(settings.shopPhone)}</div>`,
    settings.shopAddress &&
      `<div class="small">${text(settings.shopAddress)}</div>`,
  ]
    .filter(Boolean)
    .join('');

const buildMetaHtml = (invoice, customer) => {
  const lines = [
    `<div class="center"><b>HOÁ ĐƠN BÁN HÀNG</b></div>`,
    row(
      text(invoice.code || ''),
      dayjs(invoice.date).format('DD/MM/YYYY HH:mm')
    ),
  ];
  if (!isWalkInCustomer(customer)) {
    lines.push(`<div>Khách hàng: ${text(customer.name)}</div>`);
    if (customer.phone) lines.push(`<div>ĐT: ${text(customer.phone)}</div>`);
  }
  return lines.join('');
};

const buildItemHtml = (item, products) => {
  const product = products.find((entry) => entry.id === item.productId);
  const name = product?.name || item.name || 'Sản phẩm';
  const unit = getItemUnitName(item, product);
  const qty = formatMeasure(getMeasuredQty(item));
  const quantity = `${qty}${unit ? ` ${text(unit)}` : ''}`;
  const amount = item.lineTotal ?? getLineAmount(item);
  const note = item.lineNote
    ? `<div class="line-note">${text(item.lineNote)}</div>`
    : '';
  return `<div class="item"><div class="name">${text(name)}</div>${note}${row(
    `${quantity} × ${formatMoney(item.unitPrice)}`,
    formatMoney(amount)
  )}</div>`;
};

const buildTotalsHtml = (total, paid) => {
  const lines = [
    row('TỔNG CỘNG', formatMoney(total), 'row total'),
    row('Khách trả', formatMoney(paid)),
  ];
  if (paid < total) lines.push(row('Còn nợ', formatMoney(total - paid)));
  if (paid > total) lines.push(row('Tiền thối', formatMoney(paid - total)));
  return lines.join('');
};

const sumBy = (list, pick) =>
  (list || []).reduce((sum, entry) => sum + Number(pick(entry) || 0), 0);

export const buildReceipt58Html = ({
  invoice = {},
  items = [],
  products = [],
  customer,
  payments = [],
  settings = {},
}) => {
  const total = Number(
    invoice.total ??
      sumBy(items, (item) => item.lineTotal ?? getLineAmount(item))
  );
  const paid = sumBy(payments, (payment) => payment.amount);
  const note = invoice.printNote || invoice.note || '';
  const sections = [
    `<div class="center">${buildShopHtml(settings)}</div>`,
    '<div class="sep"></div>',
    buildMetaHtml(invoice, customer),
    '<div class="sep"></div>',
    items.map((item) => buildItemHtml(item, products || [])).join(''),
    '<div class="sep"></div>',
    buildTotalsHtml(total, paid),
    note ? `<div class="sep"></div><div>Ghi chú: ${text(note)}</div>` : '',
    '<div class="sep"></div>',
    '<div class="center">Cảm ơn quý khách!</div>',
  ];
  return `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8" /><title>Hoá đơn</title><style>${STYLES}</style></head>
<body>${sections.join('')}</body>
</html>`;
};
