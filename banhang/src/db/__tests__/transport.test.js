import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from '../repository.js';
import { API_BASE, sendRequest } from '../transport.js';

const stubFetch = (status, body) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('transport', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends JSON over fetch', async () => {
    const fetchMock = stubFetch(200, { ok: 1 });
    const result = await sendRequest('/x', { method: 'POST', body: { a: 1 } });
    expect(result).toMatchObject({ ok: true, status: 200, data: { ok: 1 } });
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/x`,
      expect.objectContaining({ method: 'POST', body: '{"a":1}' })
    );
  });

  it('keeps apiRequest semantics: 404 -> null, errors throw message', async () => {
    stubFetch(404, { message: 'Not found' });
    expect(await apiRequest('/missing')).toBeNull();
    stubFetch(400, { message: 'Trùng sản phẩm' });
    await expect(
      apiRequest('/products', { method: 'POST', body: {} })
    ).rejects.toThrow('Trùng sản phẩm');
  });
});
