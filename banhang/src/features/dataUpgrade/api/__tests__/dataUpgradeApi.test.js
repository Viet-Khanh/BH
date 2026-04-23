import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  commitDataUpgrade,
  getDataUpgradeStatus,
  previewDataUpgrade,
  reconcileDataUpgrade,
} from '../dataUpgradeApi.js';

const mockFetch = (payload) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    text: async () => JSON.stringify(payload),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('dataUpgradeApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls status, reconcile, preview, and commit endpoints', async () => {
    const fetchMock = mockFetch({ ok: true });

    await getDataUpgradeStatus();
    await reconcileDataUpgrade();
    await previewDataUpgrade();
    await commitDataUpgrade();

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5000/api/data-upgrade/status',
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:5000/api/data-upgrade/reconcile',
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:5000/api/data-upgrade/preview',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'http://localhost:5000/api/data-upgrade/commit',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
