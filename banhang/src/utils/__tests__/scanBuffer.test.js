import { describe, expect, it } from 'vitest';
import { createScanBuffer } from '../scanBuffer.js';

const type = (buffer, text, start, gap) =>
  [...text].map((char, index) => buffer.push(char, start + index * gap));

describe('createScanBuffer', () => {
  it('recognizes fast keystrokes ended by Enter as a scan', () => {
    const buffer = createScanBuffer();
    expect(type(buffer, '8934588012345', 0, 10)).toEqual([
      true,
      ...Array(12).fill(false),
    ]);
    expect(buffer.end(130)).toBe('8934588012345');
    expect(buffer.end(140)).toBeNull();
  });

  it('starts a new sequence after every slow keystroke', () => {
    const buffer = createScanBuffer();
    expect(type(buffer, 'abc123', 0, 150)).toEqual(Array(6).fill(true));
    expect(buffer.end(760)).toBeNull();
  });

  it('ignores short codes', () => {
    const buffer = createScanBuffer();
    type(buffer, '12', 1000, 5);
    expect(buffer.end(1010)).toBeNull();
  });

  it('ignores an Enter that comes long after the last key', () => {
    const buffer = createScanBuffer();
    type(buffer, '893458', 0, 10);
    expect(buffer.end(1000)).toBeNull();
  });

  it('never treats a burst with non-ASCII characters as a scan', () => {
    const buffer = createScanBuffer();
    type(buffer, 'tiễn', 0, 1);
    expect(buffer.end(5)).toBeNull();
  });

  it('never treats a burst interrupted by an editing key as a scan', () => {
    const buffer = createScanBuffer();
    buffer.interrupt(0);
    type(buffer, 'nhanh', 0.2, 0.1);
    expect(buffer.end(1)).toBeNull();
    type(buffer, '8934588012345', 500, 10);
    expect(buffer.end(630)).toBe('8934588012345');
  });
});
