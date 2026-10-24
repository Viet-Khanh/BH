import { mountApiRoutes } from '@backend/routes/index.js';
import { registerDemoSystemRoutes } from './demoSystemRoutes.js';
import { createResponse, createRouter } from './shims/express.js';

const app = createRouter();

// Mimics the JSON round trip of a real HTTP call (drops undefined, copies objects).
const toWire = (value) =>
  value === undefined ? null : JSON.parse(JSON.stringify(value));

// In-browser replacement for an HTTP request to banhang-backend.
export const dispatch = async ({ method = 'GET', path, body } = {}) => {
  const url = new URL(path, 'http://demo.local');
  const req = {
    method: method.toUpperCase(),
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    params: {},
    body: body === undefined ? {} : toWire(body),
  };
  const res = createResponse();
  try {
    const handled = await app.handle(req, res, url.pathname);
    if (!handled) return { status: 404, data: { message: 'Not found' } };
    return { status: res.statusCode, data: toWire(res.body) };
  } catch (error) {
    console.error(error);
    return {
      status: 500,
      data: { message: error?.message || 'Server error' },
    };
  }
};

registerDemoSystemRoutes(app, { dispatch });
mountApiRoutes(app);
