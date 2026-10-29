import { describe, expect, it } from 'vitest';
import { findBank, VIETQR_BANKS } from '../receipt/banks.js';
import { renderQrSvg } from '../receipt/qrSvg.js';

describe('VIETQR_BANKS', () => {
  it('has unique 6-digit BINs with a code and a name', () => {
    VIETQR_BANKS.forEach((bank) => {
      expect(bank.bin).toMatch(/^\d{6}$/);
      expect(bank.code).toBeTruthy();
      expect(bank.name).toBeTruthy();
    });
    const bins = VIETQR_BANKS.map((bank) => bank.bin);
    expect(new Set(bins).size).toBe(bins.length);
  });

  it('includes the main banks', () => {
    expect(findBank('970436')?.name).toBe('Vietcombank');
    expect(findBank('970418')?.name).toBe('BIDV');
    expect(findBank('970422')?.name).toBe('MB');
    expect(findBank('000000')).toBeNull();
  });
});

describe('renderQrSvg', () => {
  it('returns a deterministic SVG with an explicit mm size', () => {
    const svg = renderQrSvg('00020101021238570010A000000727', { sizeMm: 30 });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain('width="30mm"');
    expect(svg).toContain('height="30mm"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('<path');
    expect(renderQrSvg('00020101021238570010A000000727', { sizeMm: 30 })).toBe(
      svg
    );
  });

  it('returns an empty string without text', () => {
    expect(renderQrSvg('', { sizeMm: 30 })).toBe('');
  });
});

describe('renderQrSvg with printer dots', () => {
  it('shrinks the size so each module is a whole number of dots', () => {
    const svg = renderQrSvg('HD0001', { sizeMm: 30, dotsPerMm: 8 });
    const side = Number(svg.match(/viewBox="0 0 (\d+)/)[1]);
    const sizeMm = Number(svg.match(/width="([\d.]+)mm"/)[1]);
    expect(sizeMm).toBeLessThanOrEqual(30);
    expect(Number.isInteger((sizeMm * 8) / side)).toBe(true);
  });
});
