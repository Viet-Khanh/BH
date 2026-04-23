import { afterEach, describe, expect, it, vi } from 'vitest';
import { getTodayDashboard } from '../dashboardApi.js';

describe('dashboardApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches the today dashboard endpoint', async () => {
    const payload = {
      salesToday: { invoiceCount: 1, amount: 100, paid: 80, remain: 20 },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(payload),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(getTodayDashboard()).resolves.toEqual(payload);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:5000/api/dashboard/today',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });
});
