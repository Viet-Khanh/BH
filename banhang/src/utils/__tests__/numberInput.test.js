import { describe, expect, it } from 'vitest';
import {
  formatNumberInput,
  parseFlexibleNumberInput,
  parseNumberInput,
} from '../numberInput.js';

describe('numberInput', () => {
  it('keeps legacy money input parsing while typing formatted values', () => {
    expect(parseNumberInput('1.0000')).toBe('10000');
    expect(formatNumberInput('1.0000')).toBe('10.000');
    expect(formatNumberInput('1.0000', { userTyping: true })).toBe('10.000');
  });

  it('formats decimal strings from stored numeric values without inflating them', () => {
    expect(parseFlexibleNumberInput('95913.99999999999')).toBe(
      '95913.99999999999'
    );
    expect(formatNumberInput('95913.99999999999')).toBe('95.914');
    expect(formatNumberInput('1000.5')).toBe('1.000,5');
  });
});
