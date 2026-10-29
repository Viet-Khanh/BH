import { describe, expect, it } from 'vitest';
import {
  computeLogoSize,
  isLogoTooLarge,
  LOGO_MAX_BYTES,
  thresholdPixels,
} from '../receipt/logoPixels.js';

describe('computeLogoSize', () => {
  it('scales down to the printable width at 8 dots/mm, ratio kept', () => {
    expect(computeLogoSize({ width: 1000, height: 200 }, 48)).toEqual({
      width: 384,
      height: 77,
    });
  });

  it('never upscales a small image', () => {
    expect(computeLogoSize({ width: 100, height: 50 }, 72)).toEqual({
      width: 100,
      height: 50,
    });
  });

  it('caps the height at 160 px', () => {
    expect(computeLogoSize({ width: 400, height: 800 }, 72)).toEqual({
      width: 80,
      height: 160,
    });
  });

  it('returns null for an empty image', () => {
    expect(computeLogoSize({ width: 0, height: 10 }, 48)).toBeNull();
    expect(computeLogoSize(undefined, 48)).toBeNull();
  });
});

describe('thresholdPixels', () => {
  it('turns dark pixels black, light ones white, all opaque', () => {
    const data = new Uint8ClampedArray([
      10, 20, 30, 255, 240, 240, 240, 255, 200, 0, 0, 255,
    ]);
    expect([...thresholdPixels(data)]).toEqual([
      0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    ]);
  });

  it('treats transparency as white background', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 200,
    ]);
    expect([...thresholdPixels(data)]).toEqual([
      255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255,
    ]);
  });

  it('uses a custom threshold', () => {
    const data = new Uint8ClampedArray([100, 100, 100, 255]);
    expect([...thresholdPixels(data, 90)]).toEqual([255, 255, 255, 255]);
  });
});

describe('isLogoTooLarge', () => {
  it('compares the stored data URL length with 200 KB', () => {
    expect(isLogoTooLarge('x'.repeat(LOGO_MAX_BYTES))).toBe(false);
    expect(isLogoTooLarge('x'.repeat(LOGO_MAX_BYTES + 1))).toBe(true);
    expect(isLogoTooLarge(undefined)).toBe(false);
  });
});
