import { describe, expect, it } from 'vitest';
import {
  dedupeInitialsCode,
  fillImportCodes,
  resolveProductCode,
} from '../productCodes.js';

describe('dedupeInitialsCode', () => {
  it('returns the code unchanged when it is free', () => {
    expect(dedupeInitialsCode('CL3', ['AB', 'CL'])).toBe('CL3');
    expect(dedupeInitialsCode('', ['CL3'])).toBe('');
  });

  it('appends the first free number, case-insensitively', () => {
    expect(dedupeInitialsCode('CL3', ['cl3'])).toBe('CL3-2');
    expect(dedupeInitialsCode('CL3', ['CL3', 'CL3-2', ' cl3-3 '])).toBe(
      'CL3-4'
    );
  });

  it('accepts any iterable of codes and skips blanks', () => {
    expect(dedupeInitialsCode('CL3', new Set(['CL3', null, undefined]))).toBe(
      'CL3-2'
    );
  });
});

describe('resolveProductCode', () => {
  const existingCodes = ['CL3'];

  it('dedupes an auto-generated initials code', () => {
    expect(
      resolveProductCode({ code: 'CL3', name: 'Coca lon 3', existingCodes })
    ).toBe('CL3-2');
    expect(resolveProductCode({ name: 'Coca lon 3', existingCodes })).toBe(
      'CL3-2'
    );
  });

  it('keeps codes typed by the user or given by the sequence', () => {
    const base = { code: ' CL3 ', name: 'Coca lon 3', existingCodes };
    expect(resolveProductCode({ ...base, codeEdited: true })).toBe('CL3');
    expect(resolveProductCode({ ...base, sequential: true })).toBe('CL3');
  });
});

describe('fillImportCodes', () => {
  it('fills missing codes with deduped initials and keeps given codes', () => {
    const items = [
      { name: 'Coca lon 3', code: '' },
      { name: 'Cà lốc 3' },
      { name: 'Pepsi', code: 'CL3' },
    ];
    expect(fillImportCodes(items, ['CL3']).map((item) => item.code)).toEqual([
      'CL3-2',
      'CL3-3',
      'CL3',
    ]);
  });
});
