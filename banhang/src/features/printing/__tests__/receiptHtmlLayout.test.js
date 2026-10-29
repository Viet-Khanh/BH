import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECEIPT_LAYOUT,
  toggleBlock,
} from '../receipt/receiptLayout.js';
import { build, settings } from './receiptFixture.js';

describe('buildReceiptHtml layout', () => {
  it('sizes the body to the printable width of the paper', () => {
    const html = build({
      settings: { ...settings, receiptPaper: '80mm' },
    });
    expect(html).toContain('width: 72mm');
    expect(html).toContain('margin: 0 4mm');
    const custom = build({
      settings: {
        ...settings,
        receiptPaper: 'custom',
        receiptWidthMm: 76,
        receiptMarginMm: 3,
      },
    });
    expect(custom).toContain('width: 70mm');
  });

  it('uses the layout font size', () => {
    const html = build({
      settings: { ...settings, receiptLayout: { fontSizePx: 14 } },
    });
    expect(html).toContain('font: 14px/1.35');
  });

  it('prints visible blocks in layout order with custom texts', () => {
    const html = build({
      settings: {
        ...settings,
        receiptLayout: {
          blocks: [
            { key: 'footer', on: true, text: 'Hẹn gặp lại' },
            { key: 'title', on: true, text: 'PHIẾU BÁN' },
            { key: 'shop', on: false },
          ],
        },
      },
    });
    expect(html.indexOf('Hẹn gặp lại')).toBeLessThan(html.indexOf('PHIẾU BÁN'));
    expect(html.indexOf('PHIẾU BÁN')).toBeLessThan(html.indexOf('Bia Hà Nội'));
    expect(html).not.toContain('Tạp hoá Minh An');
    expect(html).not.toContain('Cảm ơn quý khách!');
  });

  it('adds the QR and barcode only when their blocks are on', () => {
    const assets = {
      qrSvg: '<svg id="qr"></svg>',
      barcodeSvg: '<svg id="bc"></svg>',
    };
    const off = build({}, assets);
    expect(off).not.toContain('id="qr"');
    expect(off).not.toContain('id="bc"');
    const on = build(
      {
        settings: {
          ...settings,
          bankBin: '970436',
          bankAccountNo: '0123',
          receiptLayout: toggleBlock(
            toggleBlock(DEFAULT_RECEIPT_LAYOUT, 'qr', true),
            'barcode',
            true
          ),
        },
      },
      assets
    );
    expect(on).toContain('id="qr"');
    expect(on).toContain('id="bc"');
  });

  it('prints the logo block from the stored image', () => {
    const logo = 'data:image/png;base64,AAAA';
    const receiptLayout = { blocks: [{ key: 'logo', on: true }] };
    expect(
      build({ settings: { ...settings, receiptLogo: logo, receiptLayout } })
    ).toContain(`<img src="${logo}"`);
    expect(
      build({ settings: { ...settings, receiptLogo: logo } })
    ).not.toContain('<img');
  });
});
