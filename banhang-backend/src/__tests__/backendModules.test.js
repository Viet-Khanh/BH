import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { defineBackendModule } from '../platform/defineBackendModule.js';
import {
  loadBackendModules,
  readModuleSelection,
} from '../platform/loadBackendModules.js';

describe('backend modules', () => {
  it('reads the selection from env with nhomkinh as default', () => {
    expect(readModuleSelection({})).toEqual({
      edition: 'nhomkinh',
      customer: null,
    });
    expect(
      readModuleSelection({
        BANHANG_EDITION: 'pharmacy',
        BANHANG_CUSTOMER: 'x',
      })
    ).toEqual({ edition: 'pharmacy', customer: 'x' });
  });

  it('loads existing modules and skips editions without backend code', async () => {
    const modules = await loadBackendModules({
      edition: 'nhomkinh',
      customer: 'example',
    });
    expect(modules.map((module) => module.id)).toEqual(['example']);
    expect(await loadBackendModules({ edition: 'pharmacy' })).toEqual([]);
  });

  it('validates module definitions', () => {
    expect(() => defineBackendModule({})).toThrow('missing id');
    expect(() =>
      defineBackendModule({ id: 'x', routers: [['/x', express.Router()]] })
    ).toThrow('must start with /api/');
    expect(() =>
      defineBackendModule({ id: 'x', routers: [['/api/x', {}]] })
    ).toThrow('is not a router');
  });

  it('mounts module routers after core routes', async () => {
    const modules = await loadBackendModules({ customer: 'example' });
    const app = createApp({ shouldServeFrontend: false, modules });
    const response = await request(app).get('/api/example/ping');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, module: 'example' });
  });
});

it('rejects ids that could escape the module folders', async () => {
  await expect(loadBackendModules({ edition: '../app' })).rejects.toThrow(
    'Invalid editions id'
  );
});
