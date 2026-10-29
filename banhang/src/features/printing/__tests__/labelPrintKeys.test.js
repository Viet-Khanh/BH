import { describe, expect, it } from 'vitest';
import { isPrintEnterKey } from '../labels/labelPrintKeys.js';

const enter = (overrides = {}) => ({
  key: 'Enter',
  target: { tagName: 'INPUT' },
  defaultPrevented: false,
  ...overrides,
});

describe('isPrintEnterKey', () => {
  it('accepts Enter anywhere in the modal, including the count input', () => {
    expect(isPrintEnterKey(enter())).toBe(true);
    expect(isPrintEnterKey(enter({ target: { tagName: 'DIV' } }))).toBe(true);
    expect(isPrintEnterKey(enter({ target: null }))).toBe(true);
  });

  it('ignores other keys, repeats, IME and modifier combos', () => {
    expect(isPrintEnterKey(enter({ key: 'a' }))).toBe(false);
    expect(isPrintEnterKey(enter({ repeat: true }))).toBe(false);
    expect(isPrintEnterKey(enter({ isComposing: true }))).toBe(false);
    expect(isPrintEnterKey(enter({ ctrlKey: true }))).toBe(false);
  });

  it('leaves Enter to buttons/switches and to an open select (prevented)', () => {
    expect(isPrintEnterKey(enter({ target: { tagName: 'BUTTON' } }))).toBe(
      false
    );
    expect(isPrintEnterKey(enter({ defaultPrevented: true }))).toBe(false);
  });
});
