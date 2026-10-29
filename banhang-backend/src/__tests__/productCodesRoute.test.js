import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

const getNextProductCode = vi.hoisted(() => vi.fn());
vi.mock('../services/productCodes.service.js', async (importOriginal) => ({
  ...(await importOriginal()),
  getNextProductCode,
}));

const { createApp } = await import('../app.js');

describe('GET /api/products/next-code', () => {
  const app = createApp({ shouldServeFrontend: false });

  it('answers before the generic /api/products/:id route', async () => {
    getNextProductCode.mockResolvedValue({ code: 'SP000124' });
    const res = await request(app).get(
      '/api/products/next-code?prefix=SP&digits=6'
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ code: 'SP000124' });
    expect(getNextProductCode).toHaveBeenCalledWith(
      expect.objectContaining({ prefix: 'SP', digits: '6' })
    );
  });

  it('answers validation errors with status 400', async () => {
    getNextProductCode.mockRejectedValue(
      Object.assign(new Error('Tiền tố sai.'), { status: 400 })
    );
    const res = await request(app).get('/api/products/next-code?prefix=1');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: 'Tiền tố sai.' });
  });
});
