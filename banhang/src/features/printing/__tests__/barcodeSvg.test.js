import { describe, expect, it } from 'vitest';
import { readBarcodeSymbol } from '../labels/barcodeSvg.js';

const fakeSvg = (attributes, innerHTML = '<rect/>') => ({
  getAttribute: (name) => attributes[name] ?? null,
  innerHTML,
});

describe('readBarcodeSymbol', () => {
  it('reads the module count from the viewBox width', () => {
    expect(readBarcodeSymbol(fakeSvg({ viewBox: '0 0 113 50' }))).toEqual({
      viewBox: '0 0 113 50',
      inner: '<rect/>',
      totalModules: 113,
    });
  });

  it('returns null without a usable viewBox', () => {
    expect(readBarcodeSymbol(fakeSvg({}))).toBeNull();
    expect(readBarcodeSymbol(fakeSvg({ viewBox: '0 0 0 50' }))).toBeNull();
    expect(readBarcodeSymbol(null)).toBeNull();
  });
});
