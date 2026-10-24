import { describe, expect, it } from 'vitest';
import express, { createResponse } from '../shims/express.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const buildApp = () => {
  const items = express.Router();
  items.get('/', (req, res) => res.json({ list: true, q: req.query.q }));
  items.get('/recent', (req, res) => res.json({ recent: true }));
  items.get('/:id', (req, res) => res.json({ id: req.params.id }));
  items.post(
    '/',
    asyncHandler(async (req, res) => res.status(201).json(req.body))
  );
  items.delete(
    '/:id',
    asyncHandler(async () => {
      throw new Error('boom');
    })
  );
  const app = express();
  app.use('/api/items', items);
  return app;
};

const call = async (app, method, path, { query = {}, body } = {}) => {
  const res = createResponse();
  const req = { method, path, query, params: {}, body };
  const handled = await app.handle(req, res);
  return { handled, res };
};

describe('express shim', () => {
  it('routes by method, mount prefix and params', async () => {
    const app = buildApp();
    const list = await call(app, 'GET', '/api/items', { query: { q: 'x' } });
    expect(list.res.body).toEqual({ list: true, q: 'x' });
    expect((await call(app, 'GET', '/api/items/recent')).res.body).toEqual({
      recent: true,
    });
    expect((await call(app, 'GET', '/api/items/a%20b')).res.body).toEqual({
      id: 'a b',
    });
    const created = await call(app, 'POST', '/api/items/', { body: { n: 1 } });
    expect(created.res.statusCode).toBe(201);
    expect(created.res.body).toEqual({ n: 1 });
  });

  it('reports unmatched routes and propagates handler errors', async () => {
    const app = buildApp();
    expect((await call(app, 'PUT', '/api/items/1')).handled).toBe(false);
    expect((await call(app, 'GET', '/api/other')).handled).toBe(false);
    await expect(call(app, 'DELETE', '/api/items/1')).rejects.toThrow('boom');
  });
});
