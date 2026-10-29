import { describe, expect, it } from 'vitest';
import { buildLabelPagesHtml } from '../labels/labelHtml.js';
import { readPrintSettings } from '../domain/printSettings.js';

const renderBarcode = (value, format) =>
  `<svg data-fake="${format}">${value}</svg>`;

const row = (overrides = {}) => ({
  key: 'p1::',
  productId: 'p1',
  name: 'Bia Hà Nội',
  unitName: '',
  unitLabel: 'lon',
  count: 1,
  price: 10000,
  barcode: 'SP001',
  barcodeFormat: 'CODE128',
  warning: '',
  ...overrides,
});

const print = readPrintSettings({});
const countOf = (html, needle) => html.split(needle).length - 1;

describe('buildLabelPagesHtml', () => {
  it('expands rows into labels and chunks pages by columns', () => {
    const html = buildLabelPagesHtml({
      rows: [row({ count: 3 }), row({ key: 'p2::', count: 2 })],
      print,
      shopName: 'Tạp hoá',
      renderBarcode,
    });
    expect(countOf(html, 'class="label"')).toBe(5);
    expect(countOf(html, 'class="page"')).toBe(3);
  });

  it('skips rows with no count', () => {
    const html = buildLabelPagesHtml({
      rows: [row({ count: 0 }), row({ count: -1 })],
      print,
      renderBarcode,
    });
    expect(countOf(html, 'class="label"')).toBe(0);
  });

  it('sizes pages and labels in mm with offsets and gaps', () => {
    const custom = readPrintSettings({
      labelOffsetXMm: 1.5,
      labelOffsetYMm: 2,
    });
    const html = buildLabelPagesHtml({
      rows: [row({ count: 2 })],
      print: custom,
      renderBarcode,
    });
    expect(html).toContain('@page { size: 72mm 22mm; margin: 0 }');
    expect(html).toContain('width: 72mm; height: 22mm');
    expect(html).toContain('left: 1.5mm; top: 2mm; width: 35mm; height: 22mm');
    expect(html).toContain('left: 38.5mm; top: 2mm');
  });

  it('renders shop name, price, barcode and its value', () => {
    const calls = [];
    const html = buildLabelPagesHtml({
      rows: [row({ unitName: 'thùng', unitLabel: 'thùng', price: 220000 })],
      print,
      shopName: 'Tạp hoá Minh An',
      renderBarcode: (value, format, size) => {
        calls.push({ value, format, size });
        return renderBarcode(value, format);
      },
    });
    expect(html).toContain('Tạp hoá Minh An');
    expect(html).toContain('220.000');
    expect(html).toContain('/thùng');
    expect(html).toContain('<svg data-fake="CODE128">SP001</svg>');
    expect(html).toContain('class="code">SP001<');
    expect(calls).toHaveLength(1);
    expect(calls[0].size.widthMm).toBeGreaterThan(0);
    expect(calls[0].size.heightMm).toBeGreaterThan(0);
  });

  it('hides shop name and price when disabled', () => {
    const html = buildLabelPagesHtml({
      rows: [row()],
      print: readPrintSettings({
        labelShowShopName: false,
        labelShowPrice: false,
      }),
      shopName: 'Tạp hoá Minh An',
      renderBarcode,
    });
    expect(html).not.toContain('Tạp hoá Minh An');
    expect(html).not.toContain('class="price"');
  });

  it('has no barcode element when the barcode is empty', () => {
    const html = buildLabelPagesHtml({
      rows: [row({ barcode: '' })],
      print,
      renderBarcode,
    });
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('class="barcode"');
  });

  it('escapes text', () => {
    const html = buildLabelPagesHtml({
      rows: [row({ name: 'Mì <Hảo>', barcode: 'A&B' })],
      print,
      shopName: '"Shop"',
      renderBarcode: () => '<svg></svg>',
    });
    expect(html).toContain('Mì &lt;Hảo&gt;');
    expect(html).toContain('&quot;Shop&quot;');
    expect(html).toContain('A&amp;B');
    expect(html).not.toContain('Mì <Hảo>');
  });
});
