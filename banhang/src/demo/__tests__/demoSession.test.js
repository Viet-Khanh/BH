import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getActiveModule,
  setActiveEdition,
} from '../../platform/moduleRuntime.js';
import { META_KEY } from '../config.js';
import { configureStorage, readCollection } from '../db/localStore.js';
import {
  activateEdition,
  bootDemoSession,
  DEMO_NOTICES,
  resetEdition,
} from '../session/demoSession.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

describe('demo session', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    configureStorage(storage);
  });

  afterEach(() => setActiveEdition('nhomkinh'));

  it('applies the chosen edition to the shared runtime', async () => {
    await activateEdition('pharmacy');
    expect(getActiveModule().editionId).toBe('pharmacy');
    configureStorage(storage);
    setActiveEdition('nhomkinh');
    await bootDemoSession();
    expect(getActiveModule().editionId).toBe('pharmacy');
  }, 30000);

  it('asks for an edition on first visit, then resumes it', async () => {
    expect(await bootDemoSession()).toEqual({ status: 'picking', notices: [] });
    const edition = await activateEdition('vlxd');
    expect(edition.id).toBe('vlxd');
    configureStorage(storage);
    const resumed = await bootDemoSession();
    expect(resumed).toMatchObject({ status: 'ready', notices: [] });
    expect(resumed.edition.id).toBe('vlxd');
    expect(readCollection('product').length).toBe(edition.products.length);
  }, 30000);

  it('keeps each edition data when switching back and forth', async () => {
    await activateEdition('vlxd');
    const vlxdInvoices = readCollection('invoice').length;
    await activateEdition('pharmacy');
    expect(readCollection('product')[0].code).toMatch(/^NT/);
    await activateEdition('vlxd');
    expect(readCollection('invoice').length).toBe(vlxdInvoices);
  }, 30000);

  it('wipes data from an older schema version', async () => {
    storage.setItem(
      META_KEY,
      JSON.stringify({ schemaVersion: 0, activeEdition: 'vlxd', editions: {} })
    );
    storage.setItem('bh-demo:v0:vlxd:product', '[]');
    const result = await bootDemoSession();
    expect(result).toEqual({
      status: 'picking',
      notices: [DEMO_NOTICES.schemaReset],
    });
    expect(storage.getItem('bh-demo:v0:vlxd:product')).toBeNull();
  });

  it('reseeds corrupt data and supports manual reset', async () => {
    await activateEdition('minimart');
    storage.setItem('bh-demo:v2:minimart:invoice', '{broken');
    configureStorage(storage);
    const result = await bootDemoSession();
    expect(result.notices).toEqual([DEMO_NOTICES.corruptReset]);
    expect(readCollection('invoice').length).toBeGreaterThan(0);
    await resetEdition('minimart');
    expect(readCollection('invoice').length).toBeGreaterThan(0);
  }, 30000);

  it('reports blocked storage', async () => {
    configureStorage(null);
    expect(await bootDemoSession()).toEqual({ status: 'blocked' });
  });
});
