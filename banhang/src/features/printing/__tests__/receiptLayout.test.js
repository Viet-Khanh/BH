import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RECEIPT_LAYOUT,
  isBlockOn,
  moveBlock,
  normalizeReceiptLayout,
  setBlockText,
  setFontSize,
  setItemsStyle,
  toggleBlock,
} from '../receipt/receiptLayout.js';

const keys = (layout) => layout.blocks.map((block) => block.key);
const block = (layout, key) => layout.blocks.find((item) => item.key === key);

describe('DEFAULT_RECEIPT_LAYOUT', () => {
  it('lists every block in print order', () => {
    expect(DEFAULT_RECEIPT_LAYOUT.fontSizePx).toBe(12);
    expect(keys(DEFAULT_RECEIPT_LAYOUT)).toEqual([
      'logo',
      'shop',
      'title',
      'meta',
      'customer',
      'items',
      'totals',
      'note',
      'qr',
      'barcode',
      'footer',
    ]);
    expect(block(DEFAULT_RECEIPT_LAYOUT, 'title').text).toBe(
      'HOÁ ĐƠN BÁN HÀNG'
    );
    expect(block(DEFAULT_RECEIPT_LAYOUT, 'footer').text).toBe(
      'Cảm ơn quý khách!'
    );
    expect(block(DEFAULT_RECEIPT_LAYOUT, 'items').style).toBe('twoLine');
  });
});

describe('normalizeReceiptLayout', () => {
  it('returns the default for missing or broken input', () => {
    expect(normalizeReceiptLayout()).toEqual(DEFAULT_RECEIPT_LAYOUT);
    expect(normalizeReceiptLayout(null)).toEqual(DEFAULT_RECEIPT_LAYOUT);
    expect(normalizeReceiptLayout({ blocks: 'x' })).toEqual(
      DEFAULT_RECEIPT_LAYOUT
    );
  });

  it('keeps the order, drops unknown keys and appends missing ones', () => {
    const layout = normalizeReceiptLayout({
      blocks: [
        { key: 'footer', on: true },
        { key: 'magic', on: true },
        { key: 'qr', on: true },
        { key: 'qr', on: false },
        { key: 'shop', on: false },
      ],
    });
    expect(keys(layout).slice(0, 3)).toEqual(['footer', 'qr', 'shop']);
    expect(keys(layout)).toHaveLength(11);
    expect(block(layout, 'qr').on).toBe(true);
    expect(block(layout, 'shop').on).toBe(false);
    expect(block(layout, 'logo').on).toBe(false);
    expect(block(layout, 'meta').on).toBe(true);
  });

  it('forces items and totals on', () => {
    const layout = normalizeReceiptLayout({
      blocks: [
        { key: 'items', on: false },
        { key: 'totals', on: false },
      ],
    });
    expect(block(layout, 'items').on).toBe(true);
    expect(block(layout, 'totals').on).toBe(true);
  });

  it('clamps the font size', () => {
    expect(normalizeReceiptLayout({ fontSizePx: 4 }).fontSizePx).toBe(9);
    expect(normalizeReceiptLayout({ fontSizePx: 40 }).fontSizePx).toBe(16);
    expect(normalizeReceiptLayout({ fontSizePx: '13.6' }).fontSizePx).toBe(14);
    expect(normalizeReceiptLayout({ fontSizePx: 'x' }).fontSizePx).toBe(12);
  });

  it('trims texts, falls back to defaults and validates the items style', () => {
    const layout = normalizeReceiptLayout({
      blocks: [
        { key: 'title', on: true, text: '  PHIẾU THU  ' },
        { key: 'footer', on: true, text: '   ' },
        { key: 'items', on: true, style: 'grid' },
      ],
    });
    expect(block(layout, 'title').text).toBe('PHIẾU THU');
    expect(block(layout, 'footer').text).toBe('Cảm ơn quý khách!');
    expect(block(layout, 'items').style).toBe('twoLine');
    const compact = normalizeReceiptLayout({
      blocks: [{ key: 'items', style: 'compact' }],
    });
    expect(block(compact, 'items').style).toBe('compact');
    expect(block(compact, 'shop')).not.toHaveProperty('text');
  });
});

describe('layout editors', () => {
  it('moves a block up or down within bounds', () => {
    const layout = moveBlock(DEFAULT_RECEIPT_LAYOUT, 'shop', -1);
    expect(keys(layout).slice(0, 2)).toEqual(['shop', 'logo']);
    expect(moveBlock(layout, 'shop', -1)).toEqual(layout);
    const last = moveBlock(DEFAULT_RECEIPT_LAYOUT, 'footer', 1);
    expect(last).toEqual(DEFAULT_RECEIPT_LAYOUT);
    expect(keys(DEFAULT_RECEIPT_LAYOUT)[0]).toBe('logo');
  });

  it('toggles blocks except the forced ones', () => {
    const layout = toggleBlock(DEFAULT_RECEIPT_LAYOUT, 'qr', true);
    expect(isBlockOn(layout, 'qr')).toBe(true);
    expect(isBlockOn(DEFAULT_RECEIPT_LAYOUT, 'qr')).toBe(false);
    expect(isBlockOn(toggleBlock(layout, 'items', false), 'items')).toBe(true);
  });

  it('sets texts, items style and font size', () => {
    const titled = setBlockText(DEFAULT_RECEIPT_LAYOUT, 'title', 'HĐ');
    expect(block(titled, 'title').text).toBe('HĐ');
    expect(setBlockText(DEFAULT_RECEIPT_LAYOUT, 'shop', 'x')).toEqual(
      DEFAULT_RECEIPT_LAYOUT
    );
    const compact = setItemsStyle(DEFAULT_RECEIPT_LAYOUT, 'compact');
    expect(block(compact, 'items').style).toBe('compact');
    expect(block(setItemsStyle(compact, 'grid'), 'items').style).toBe(
      'compact'
    );
    expect(setFontSize(DEFAULT_RECEIPT_LAYOUT, 20).fontSizePx).toBe(16);
  });
});
