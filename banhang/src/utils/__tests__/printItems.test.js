import { describe, expect, it } from 'vitest';
import { buildItemsHtml } from '../printItems.js';

const products = [{ id: 'p1', name: 'Kính <8ly>', unit: 'm2' }];
const items = [
  {
    productId: 'p1',
    qty: 2,
    length: 1.5,
    width: 2,
    unitPrice: 1000,
    lineTotal: 6000,
  },
  {
    productId: 'p1',
    qty: 1,
    unitPrice: 1000,
    lineTotal: 1000,
    lineNote: 'cắt góc',
  },
];

const headers = (html) =>
  [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((match) => match[1]);

describe('buildItemsHtml', () => {
  it('prints dimension columns when enabled', () => {
    const html = buildItemsHtml(items, products, { dimensions: true });
    expect(headers(html)).toEqual([
      'TT',
      'Tên hàng',
      'ĐVT',
      'SL',
      'D',
      'R',
      'M2',
      'Đơn giá',
      'Thành tiền',
    ]);
    expect(html).toContain('>6<');
  });

  it('omits dimension columns when disabled', () => {
    const html = buildItemsHtml(items, products, { dimensions: false });
    expect(headers(html)).toEqual([
      'TT',
      'Tên hàng',
      'ĐVT',
      'SL',
      'Đơn giá',
      'Thành tiền',
    ]);
  });

  it('escapes names, prints repeated product names once and keeps notes', () => {
    const html = buildItemsHtml(items, products, { dimensions: false });
    expect(html.match(/Kính &lt;8ly&gt;/g)).toHaveLength(1);
    expect(html).toContain('cắt góc');
  });
});
