import { afterEach, describe, expect, it, vi } from 'vitest';
import { getNextProductCode } from '../repository.js';
import { API_BASE } from '../transport.js';

describe('getNextProductCode', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks the API for the next SP code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ code: 'SP000124' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    await expect(getNextProductCode()).resolves.toBe('SP000124');
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/products/next-code?prefix=SP&digits=6`,
      expect.any(Object)
    );
  });
});
