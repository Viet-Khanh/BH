import { describe, expect, it } from 'vitest';
import {
  buildPageSizeCss,
  injectPageSizeCss,
  normalizeMmPageSize,
  normalizePageSize,
  toMicrons,
} from '../printPageSize.js';

describe('normalizePageSize', () => {
  it('accepts named sizes in any case', () => {
    expect(normalizePageSize(' a5 ')).toBe('A5');
    expect(normalizePageSize('letter')).toBe('Letter');
    expect(normalizePageSize('TABLOID')).toBe('Tabloid');
  });

  it('rejects unknown or empty values', () => {
    expect(normalizePageSize('')).toBe('');
    expect(normalizePageSize('B5')).toBe('');
    expect(normalizePageSize({ widthMm: 58, heightMm: 100 })).toBe('');
  });
});

describe('mm page sizes', () => {
  it('converts mm to microns', () => {
    expect(toMicrons(58)).toBe(58000);
    expect(toMicrons(22.5)).toBe(22500);
    expect(toMicrons(0.0004)).toBe(0);
  });

  it('normalizes a { widthMm, heightMm } size', () => {
    expect(normalizeMmPageSize({ widthMm: 72, heightMm: 22 })).toEqual({
      widthMm: 72,
      heightMm: 22,
    });
    expect(normalizeMmPageSize({ widthMm: 58.123, heightMm: '40' })).toEqual({
      widthMm: 58.12,
      heightMm: 40,
    });
    expect(normalizeMmPageSize({ widthMm: 0, heightMm: 22 })).toBeNull();
    expect(normalizeMmPageSize({ widthMm: 'x', heightMm: 22 })).toBeNull();
    expect(normalizeMmPageSize('A4')).toBeNull();
    expect(normalizeMmPageSize(null)).toBeNull();
  });

  it('builds @page css in mm', () => {
    expect(buildPageSizeCss({ widthMm: 72, heightMm: 22 })).toBe(
      '@page { size: 72mm 22mm; margin: 0 }'
    );
  });
});

describe('injectPageSizeCss', () => {
  const html = '<html><head></head><body>x</body></html>';

  it('injects a named size before </body>', () => {
    expect(injectPageSizeCss(html, 'a5')).toBe(
      '<html><head></head><body>x<style id="__print_page_size__">@page { size: A5 portrait; }</style></body></html>'
    );
  });

  it('injects a mm size', () => {
    expect(injectPageSizeCss(html, { widthMm: 58, heightMm: 120 })).toContain(
      '<style id="__print_page_size__">@page { size: 58mm 120mm; margin: 0 }</style></body>'
    );
  });

  it('falls back to </head> or prefix, and ignores invalid sizes', () => {
    expect(injectPageSizeCss('<head></head>', 'A4')).toBe(
      '<head><style id="__print_page_size__">@page { size: A4 portrait; }</style></head>'
    );
    expect(injectPageSizeCss('x', 'A4')).toBe(
      '<style id="__print_page_size__">@page { size: A4 portrait; }</style>x'
    );
    expect(injectPageSizeCss(html, 'nope')).toBe(html);
    expect(injectPageSizeCss(html, '')).toBe(html);
  });
});
