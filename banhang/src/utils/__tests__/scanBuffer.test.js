import { describe, expect, it } from 'vitest';
import { createScanBuffer } from '../scanBuffer.js';

const type = (buffer, text, start, gap) =>
  [...text].map((char, index) => buffer.push(char, start + index * gap));

describe('createScanBuffer', () => {
  it('recognizes fast keystrokes ended by Enter as a scan', () => {
    const buffer = createScanBuffer();
    expect(type(buffer, '8934588012345', 0, 10)).toEqual([
      'first',
      ...Array(12).fill('scanning'),
    ]);
    expect(buffer.end(130)).toBe('8934588012345');
    expect(buffer.end(140)).toBeNull();
  });

  it('ignores slow typing and short codes', () => {
    const buffer = createScanBuffer();
    expect(type(buffer, 'abc123', 0, 150)).toEqual(Array(6).fill('first'));
    expect(buffer.end(900)).toBeNull();
    type(buffer, '12', 1000, 5);
    expect(buffer.end(1010)).toBeNull();
  });

  it('ignores an Enter that comes long after the last key', () => {
    const buffer = createScanBuffer();
    type(buffer, '893458', 0, 10);
    expect(buffer.end(1000)).toBeNull();
  });
});
