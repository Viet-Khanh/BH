// Minimal Express replacement for running banhang-backend routers in the browser.
// Supports: express(), express.Router(), use(path, router), get/post/put/delete with :params.
const ROUTE_METHODS = ['get', 'post', 'put', 'delete'];

const trimTrailingSlash = (path) =>
  path.length > 1 ? path.replace(/\/+$/, '') : path;

const compileRoutePath = (path) => {
  const keys = [];
  const source = trimTrailingSlash(path)
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')
    .replace(/:(\w+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
  return { keys, regex: new RegExp(`^${source === '/' ? '' : source}/?$`) };
};

const matchParams = (layer, path) => {
  const match = layer.regex.exec(path);
  if (!match) return null;
  return Object.fromEntries(
    layer.keys.map((key, index) => [key, decodeURIComponent(match[index + 1])])
  );
};

const stripMountPrefix = (prefix, path) => {
  if (prefix === '/') return path;
  if (path === prefix) return '/';
  return path.startsWith(`${prefix}/`) ? path.slice(prefix.length) : null;
};

// Resolves true when a handler answered; throws errors passed to next(error).
const runHandlers = async (handlers, req, res) => {
  for (const handler of handlers) {
    let nextCalled = false;
    let nextError = null;
    await handler(req, res, (error) => {
      nextCalled = true;
      nextError = error || null;
    });
    if (nextError) throw nextError;
    if (!nextCalled || res.finished) return true;
  }
  return false;
};

export const createRouter = () => {
  const layers = [];
  const router = {
    use(prefix, child) {
      if (typeof prefix !== 'string' || typeof child?.handle !== 'function') {
        throw new Error('express shim: only use(path, router) is supported');
      }
      layers.push({ prefix: trimTrailingSlash(prefix), child });
      return router;
    },
    async handle(req, res, path = req.path) {
      for (const layer of layers) {
        if (layer.child) {
          const rest = stripMountPrefix(layer.prefix, path);
          if (rest !== null && (await layer.child.handle(req, res, rest))) {
            return true;
          }
          continue;
        }
        if (layer.method !== req.method) continue;
        const params = matchParams(layer, path);
        if (!params) continue;
        req.params = params;
        if (await runHandlers(layer.handlers, req, res)) return true;
      }
      return false;
    },
  };
  ROUTE_METHODS.forEach((method) => {
    router[method] = (path, ...handlers) => {
      layers.push({
        method: method.toUpperCase(),
        handlers,
        ...compileRoutePath(path),
      });
      return router;
    };
  });
  return router;
};

export const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  finished: false,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    this.body = data;
    this.finished = true;
    return this;
  },
});

const express = () => createRouter();
express.Router = createRouter;

export { createRouter as Router };
export default express;
