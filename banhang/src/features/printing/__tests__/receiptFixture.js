// Shared sample sale for the receipt HTML tests.
import { buildReceiptHtml } from '../receipt/receiptHtml.js';

export const products = [
  { id: 'p1', name: 'Bia Hà Nội', unit: 'lon' },
  { id: 'p2', name: 'Mì <Hảo Hảo>', unit: 'gói' },
];

export const settings = {
  shopName: 'Tạp hoá Minh An',
  shopPhone: '0901 234 567',
  shopAddress: '12 Lê Lợi',
};

export const items = [
  {
    productId: 'p1',
    unitName: 'thùng',
    qty: 2,
    unitPrice: 220000,
    lineTotal: 440000,
  },
  { productId: 'p2', qty: 3, unitPrice: 5000, lineTotal: 15000 },
];

export const invoice = {
  code: 'HD0001',
  date: '2026-10-29T08:05:00',
  total: 455000,
};

export const build = (overrides = {}, assets) =>
  buildReceiptHtml(
    {
      invoice,
      items,
      products,
      customer: { name: 'Khách lẻ' },
      payments: [{ amount: 500000 }],
      settings,
      ...overrides,
    },
    assets
  );
