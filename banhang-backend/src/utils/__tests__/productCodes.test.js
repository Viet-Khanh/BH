import { describe, expect, it } from 'vitest';
import { nextSequentialCode } from '../productCodes.js';

describe('nextSequentialCode', () => {
  it('starts at SP000001 without sequential codes', () => {
    expect(nextSequentialCode([])).toBe('SP000001');
    expect(nextSequentialCode(['CL3', 'TH001', '', null])).toBe('SP000001');
  });

  it('continues after the largest prefix code', () => {
    expect(nextSequentialCode(['SP000002', 'SP000123', 'SP000009'])).toBe(
      'SP000124'
    );
  });

  it('matches the prefix case-insensitively and keeps the given case', () => {
    expect(nextSequentialCode(['sp000041', ' SP000007 '])).toBe('SP000042');
    expect(nextSequentialCode(['SP000005'], { prefix: 'sp' })).toBe('sp000006');
  });

  it('ignores codes with other characters after the digits', () => {
    expect(nextSequentialCode(['SP000010-2', 'SP12A', 'SPX1'])).toBe(
      'SP000001'
    );
  });

  it('uses the given prefix and digits', () => {
    expect(nextSequentialCode(['HH0099'], { prefix: 'HH', digits: 4 })).toBe(
      'HH0100'
    );
  });

  it('keeps the length of numbers longer than the padding', () => {
    expect(nextSequentialCode(['SP999999'])).toBe('SP1000000');
    expect(nextSequentialCode(['SP12345678'])).toBe('SP12345679');
  });
});
