import { describe, expect, it, vi } from 'vitest';
import { quickAddByCode } from '../quickAddByCode.js';

describe('quickAddByCode', () => {
  it('adds a trimmed single-word code', async () => {
    const addByCode = vi.fn().mockResolvedValue(true);
    await expect(quickAddByCode(addByCode, ' 8934588012345 ')).resolves.toBe(
      true
    );
    expect(addByCode).toHaveBeenCalledWith('8934588012345');
  });

  it('returns false when nothing matches', async () => {
    const addByCode = vi.fn().mockResolvedValue(false);
    await expect(quickAddByCode(addByCode, 'SP01')).resolves.toBe(false);
  });

  it('skips empty keywords, keywords with spaces and a missing adder', async () => {
    const addByCode = vi.fn().mockResolvedValue(true);
    await expect(quickAddByCode(addByCode, '   ')).resolves.toBe(false);
    await expect(quickAddByCode(addByCode, 'kinh trang')).resolves.toBe(false);
    await expect(quickAddByCode(undefined, 'SP01')).resolves.toBe(false);
    expect(addByCode).not.toHaveBeenCalled();
  });

  it('falls back (false) when the search fails', async () => {
    const addByCode = vi.fn().mockRejectedValue(new Error('offline'));
    await expect(quickAddByCode(addByCode, 'SP01')).resolves.toBe(false);
  });
});
