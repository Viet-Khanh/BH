import { describe, expect, it } from 'vitest';
import {
  getReceiptQrPayload,
  loadReceiptAssets,
  toBarcodeSvg,
} from '../receipt/receiptAssets.js';
import { buildReceiptContext } from '../receipt/receiptContext.js';
import {
  DEFAULT_RECEIPT_LAYOUT,
  toggleBlock,
} from '../receipt/receiptLayout.js';

const bank = {
  bankBin: '970436',
  bankAccountNo: '0123456789',
  bankAccountName: 'NGUYEN VAN A',
};
const qrLayout = toggleBlock(DEFAULT_RECEIPT_LAYOUT, 'qr', true);

const data = (settings = {}, payments = [{ amount: 400 }]) => ({
  invoice: { code: 'HD-0001', date: '2026-10-29', total: 1000 },
  items: [],
  products: [],
  customer: null,
  payments,
  settings: { receiptPaper: '58mm', ...settings },
});

describe('getReceiptQrPayload', () => {
  const payload = (settings, payments) =>
    getReceiptQrPayload(buildReceiptContext(data(settings, payments)));

  it('pays the amount due to the shop account, noted with the invoice code', () => {
    const text = payload({ ...bank, receiptLayout: qrLayout });
    expect(text).toContain('0006970436');
    expect(text).toContain('0123456789');
    expect(text).toContain('5403600');
    expect(text).toContain('0806HD0001');
  });

  it('needs the qr block, complete bank info and an amount due', () => {
    expect(payload(bank)).toBe('');
    expect(payload({ receiptLayout: qrLayout, bankBin: '970436' })).toBe('');
    expect(
      payload({ ...bank, receiptLayout: qrLayout }, [{ amount: 1000 }])
    ).toBe('');
  });
});

describe('loadReceiptAssets', () => {
  it('renders the QR SVG when the block can show', async () => {
    const assets = await loadReceiptAssets(
      data({ ...bank, receiptLayout: qrLayout })
    );
    expect(assets.qrSvg).toMatch(/^<svg /);
    expect(assets.barcodeSvg).toBe('');
  });

  it('renders nothing for hidden blocks', async () => {
    expect(await loadReceiptAssets(data(bank))).toEqual({
      qrSvg: '',
      barcodeSvg: '',
    });
  });

  it('skips the barcode without a DOM (JsBarcode needs one)', async () => {
    const layout = toggleBlock(DEFAULT_RECEIPT_LAYOUT, 'barcode', true);
    const assets = await loadReceiptAssets(data({ receiptLayout: layout }));
    expect(assets.barcodeSvg).toBe('');
  });
});

describe('toBarcodeSvg', () => {
  const symbol = { viewBox: '0 0 143 50', inner: '<rect/>', totalModules: 143 };

  it('snaps modules to whole printer dots within the printable width', () => {
    const svg = toBarcodeSvg(symbol, 48);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('width="35.75mm"');
    expect(svg).toContain('height="10mm"');
    expect(svg).toContain('viewBox="0 0 143 50"');
    expect(svg).toContain('preserveAspectRatio="none"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('<rect/>');
  });

  it('returns an empty string without a symbol', () => {
    expect(toBarcodeSvg(null, 48)).toBe('');
  });
});
