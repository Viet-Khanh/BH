import { describe, expect, it, vi } from 'vitest';
import { guardProductSearch } from '../guardProductSearch.js';

describe('guardProductSearch', () => {
  it('returns the search result', async () => {
    const search = guardProductSearch(async (keyword) => [keyword], vi.fn());
    await expect(search('coca')).resolves.toEqual(['coca']);
  });

  it('typing search: reports the error and returns []', async () => {
    const onError = vi.fn();
    const error = new Error('offline');
    const search = guardProductSearch(async () => {
      throw error;
    }, onError);
    await expect(search('coca')).resolves.toEqual([]);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('scan search (throwOnError): rejects with the real error, no report', async () => {
    const onError = vi.fn();
    const search = guardProductSearch(async () => {
      throw new Error('offline');
    }, onError);
    await expect(search('893', { throwOnError: true })).rejects.toThrow(
      'offline'
    );
    expect(onError).not.toHaveBeenCalled();
  });
});
