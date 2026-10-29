import { describe, expect, it } from 'vitest';
import {
  createLabelKeyHandler,
  isPrintEnterKey,
} from '../labels/labelPrintKeys.js';

const element = (tagName, { inModal = true, role = null } = {}) => ({
  tagName,
  getAttribute: (name) => (name === 'role' ? role : null),
  closest: (selector) =>
    inModal && selector === '.label-print-modal' ? {} : null,
});

const enter = (overrides = {}) => ({
  key: 'Enter',
  target: element('INPUT'),
  defaultPrevented: false,
  ...overrides,
});

describe('isPrintEnterKey', () => {
  it('accepts Enter anywhere in the modal, including the count input', () => {
    expect(isPrintEnterKey(enter())).toBe(true);
    expect(isPrintEnterKey(enter({ target: element('DIV') }))).toBe(true);
    expect(isPrintEnterKey(enter({ target: null }))).toBe(true);
  });

  it('ignores other keys, repeats, IME and modifier combos', () => {
    expect(isPrintEnterKey(enter({ key: 'a' }))).toBe(false);
    expect(isPrintEnterKey(enter({ repeat: true }))).toBe(false);
    expect(isPrintEnterKey(enter({ isComposing: true }))).toBe(false);
    expect(isPrintEnterKey(enter({ ctrlKey: true }))).toBe(false);
  });

  it("leaves Enter to the modal's buttons/switches and to an open select", () => {
    expect(isPrintEnterKey(enter({ target: element('BUTTON') }))).toBe(false);
    const toggle = element('SPAN', { role: 'switch' });
    expect(isPrintEnterKey(enter({ target: toggle }))).toBe(false);
    expect(isPrintEnterKey(enter({ defaultPrevented: true }))).toBe(false);
  });

  it('prints when the focused button is outside the modal', () => {
    const behind = element('BUTTON', { inModal: false });
    expect(isPrintEnterKey(enter({ target: behind }))).toBe(true);
    expect(isPrintEnterKey(enter({ target: { tagName: 'BUTTON' } }))).toBe(
      true
    );
  });
});

const key = (value, timeStamp, overrides = {}) => ({
  key: value,
  timeStamp,
  target: element('INPUT'),
  ...overrides,
});

const typeKeys = (handle, text, start, gap) =>
  [...text].map((char, index) => handle(key(char, start + index * gap)));

describe('createLabelKeyHandler', () => {
  it('prints on a typed Enter', () => {
    const handle = createLabelKeyHandler();
    typeKeys(handle, '12', 0, 200);
    expect(handle(key('Enter', 600))).toBe('print');
  });

  it("swallows a scanner's closing Enter instead of printing", () => {
    const handle = createLabelKeyHandler();
    expect(typeKeys(handle, '8934588012228', 1000, 5)).toEqual(
      Array(13).fill(null)
    );
    expect(handle(key('Enter', 1070))).toBe('scan');
    expect(handle(key('Enter', 2000))).toBe('print');
  });

  it('keeps Shift inside a scan (upper-case codes)', () => {
    const handle = createLabelKeyHandler();
    handle(key('Shift', 0));
    typeKeys(handle, 'SP001', 2, 5);
    expect(handle(key('Enter', 30))).toBe('scan');
  });

  it('treats a fast burst broken by an editing key as typing', () => {
    const handle = createLabelKeyHandler();
    typeKeys(handle, 'abcd', 0, 5);
    handle(key('Backspace', 22));
    expect(handle(key('Enter', 30))).toBe('print');
  });

  it('returns null for non-print Enter and ignores modified keys', () => {
    const handle = createLabelKeyHandler();
    expect(handle(key('Enter', 0, { target: element('BUTTON') }))).toBeNull();
    expect(handle(key('c', 10, { ctrlKey: true }))).toBeNull();
    expect(handle(key('a', 20))).toBeNull();
  });
});
