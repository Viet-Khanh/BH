import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';

describe('createApp', () => {
  it('registers the health endpoint and domain routers', () => {
    const app = createApp({ shouldServeFrontend: false });
    const stack = app._router?.stack || [];
    const healthLayer = stack.find(
      (layer) => layer.route?.path === '/api/health'
    );
    const mountedRouters = stack
      .filter((layer) => layer.name === 'router')
      .map((layer) => layer.regexp?.toString?.() || '');

    expect(healthLayer?.route?.methods?.get).toBe(true);
    expect(mountedRouters.some((value) => value.includes('api\\/sales'))).toBe(
      true
    );
    expect(
      mountedRouters.some((value) => value.includes('api\\/payments'))
    ).toBe(true);
    expect(
      mountedRouters.some((value) => value.includes('api\\/invoices'))
    ).toBe(true);
    expect(
      mountedRouters.some((value) => value.includes('api\\/opening-import'))
    ).toBe(true);
    expect(
      mountedRouters.some((value) => value.includes('api\\/dashboard'))
    ).toBe(true);
    expect(
      mountedRouters.some((value) => value.includes('api\\/data-upgrade'))
    ).toBe(true);
  });
});
