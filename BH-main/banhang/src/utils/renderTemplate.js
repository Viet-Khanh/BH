import dayjs from 'dayjs';
import { formatMoney } from './moneyFormat.js';

export const buildItemsHtml = (items = [], products = []) => {
  let lastProductKey = null;
  const rows = items
    .map((item, index) => {
      const product = products.find((p) => p.id === item.productId);
      const name = product ? product.name : 'Sản phẩm';
      const code = product?.code || '';
      const unit = product?.unit || '';
      const productKey = item.productId ?? name;
      const showName = productKey !== lastProductKey;
      lastProductKey = productKey;
      const nameCell = showName
        ? `<div><strong>${name}</strong></div><div>${code}</div>`
        : '';
      const length = item.length === null || item.length === undefined || item.length === '' ? '-' : item.length;
      const width = item.width === null || item.width === undefined || item.width === '' ? '-' : item.width;
      const note = item.lineNote || '';
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${nameCell}</td>
          <td>${unit}</td>
          <td>${length}</td>
          <td>${width}</td>
          <td>${item.qty}</td>
          <td>${formatMoney(item.unitPrice)}</td>
          <td>${formatMoney(item.lineTotal)}</td>
          <td>${note}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <table class="items">
      <thead>
        <tr>
          <th>STT</th>
          <th>Tên hàng</th>
          <th>ĐVT</th>
          <th>Dài</th>
          <th>Rộng</th>
          <th>SL/m2</th>
          <th>Đơn giá</th>
          <th>Thành tiền</th>
          <th>Ghi chú</th>
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
  const debt = Number(invoice.total || 0) - paid;
  const itemsHtml = buildItemsHtml(items, products || []);
  const customerDebt = Number(invoice.customerDebt || 0);
  const staff = invoice.staff || 'admin';

  const replacements = {
    '{{invoice.code}}': invoice.code || '',
    '{{customer.name}}': customer?.name || 'Khách lẻ',
    '{{customer.phone}}': customer?.phone || '',
    '{{customer.address}}': customer?.address || '',
    '{{customer.debt}}': formatMoney(customerDebt),
    '{{items}}': itemsHtml,
    '{{items.count}}': String(itemsCount),
    '{{items.qty}}': totalQtyLabel,
    '{{total}}': formatMoney(invoice.total || 0),
    '{{paid}}': formatMoney(paid),
    '{{debt}}': formatMoney(debt),
    '{{date}}': dayjs(invoice.date).format('DD/MM/YYYY'),
    '{{note}}': invoice.note || '',
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
