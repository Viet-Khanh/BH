import { describe, expect, it } from 'vitest';
import { buildLabelPagesHtml } from '../labels/labelHtml.js';
import { readPrintSettings } from '../domain/printSettings.js';

const renderBarcode = (value, format) => ({
  viewBox: '0 0 113 50',
  inner: `<rect data-fake="${format}" data-value="${value}"/>`,
  totalModules: 113,
});

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
    expect(html).toContain('width: 72mm; height: 21.9mm');
    expect(html).toContain('left: 1.5mm; top: 2mm; width: 35mm; height: 22mm');
    expect(html).toContain('left: 38.5mm; top: 2mm');
  });

  it('renders shop name, price, barcode and its value', () => {
    const calls = [];
    const html = buildLabelPagesHtml({
      rows: [row({ unitName: 'thùng', unitLabel: 'thùng', price: 220000 })],
      print,
      shopName: 'Tạp hoá Minh An',
      renderBarcode: (value, format) => {
        calls.push({ value, format });
        return renderBarcode(value, format);
      },
    });
    expect(html).toContain('Tạp hoá Minh An');
    expect(html).toContain('220.000');
    expect(html).toContain('/thùng');
    expect(html).toContain('<rect data-fake="CODE128" data-value="SP001"/>');
    expect(html).toContain('class="code">SP001<');
    expect(calls).toEqual([{ value: 'SP001', format: 'CODE128' }]);
  });

  it('draws each row once as a symbol and reuses it per label', () => {
    const calls = [];
    const html = buildLabelPagesHtml({
      rows: [row({ count: 3 }), row({ key: 'p2::', barcode: '', count: 1 })],
      print,
      renderBarcode: (value, format) => {
        calls.push(value);
        return renderBarcode(value, format);
      },
    });
    expect(calls).toEqual(['SP001']);
    expect(countOf(html, '<symbol id="bc-0" viewBox="0 0 113 50"')).toBe(1);
    expect(countOf(html, '<use href="#bc-0"/>')).toBe(3);
  });

  it('sizes the barcode in whole printer dots, centered, not stretched', () => {
    const html = buildLabelPagesHtml({ rows: [row()], print, renderBarcode });
    // 35 mm label - 2 × 1 mm padding = 33 mm → floor(264 dots / 113) = 2 dots.
    expect(html).toContain('<svg width="28.25mm" height=');
    expect(html).toContain('shape-rendering="crispEdges"');
    expect(html).not.toContain('width: 100%; height: 100%');
  });

  it('keeps the page a hair shorter than @page (no blank label)', () => {
    const html = buildLabelPagesHtml({ rows: [row()], print, renderBarcode });
    expect(html).toContain('@page { size: 72mm 22mm; margin: 0 }');
    expect(html).toContain('class="page" style="width: 72mm; height: 21.9mm"');
  });

  it('prints the code without a barcode when it cannot be rendered', () => {
    const html = buildLabelPagesHtml({
      rows: [row()],
      print,
      renderBarcode: () => null,
    });
    expect(html).not.toContain('<svg');
    expect(html).toContain('class="code">SP001<');
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
      renderBarcode,
    });
    expect(html).toContain('Mì &lt;Hảo&gt;');
    expect(html).toContain('&quot;Shop&quot;');
    expect(html).toContain('A&amp;B');
    expect(html).not.toContain('Mì <Hảo>');
  });
});
