import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearNamespace,
  configureStorage,
  findCorruptCollections,
  readCollection,
  setActiveNamespace,
  writeCollection,
} from '../db/localStore.js';
import { createMemoryStorage } from './helpers/memoryStorage.js';

describe('localStore', () => {
  let storage;

  beforeEach(() => {
    storage = createMemoryStorage();
    configureStorage(storage);
    setActiveNamespace('minimart');
  });

  it('persists collections under the namespaced key', () => {
    writeCollection('product', [{ id: 'p1' }]);
    expect(storage.getItem('bh-demo:v2:minimart:product')).toBe(
      '[{"id":"p1"}]'
    );
    configureStorage(storage);
    setActiveNamespace('minimart');
    expect(readCollection('product')).toEqual([{ id: 'p1' }]);
  });

  it('keeps namespaces separate', () => {
    writeCollection('product', [{ id: 'p1' }]);
    setActiveNamespace('vlxd');
    expect(readCollection('product')).toEqual([]);
  });

  it('keeps previous data when the quota is exceeded', () => {
    configureStorage(createMemoryStorage({ quotaBytes: 40 }));
    setActiveNamespace('minimart');
    writeCollection('product', [{ id: 'p1' }]);
    expect(() =>
      writeCollection('product', [{ id: 'p1' }, { id: 'x'.repeat(50) }])
    ).toThrow('Bộ nhớ demo đã đầy');
    expect(readCollection('product')).toEqual([{ id: 'p1' }]);
  });

  it('detects corrupt collections and clears a namespace', () => {
    storage.setItem('bh-demo:v2:minimart:invoice', '{oops');
    expect(findCorruptCollections('minimart')).toEqual([
      'bh-demo:v2:minimart:invoice',
    ]);
    expect(() => readCollection('invoice')).toThrow('Dữ liệu demo bị hỏng');
    clearNamespace('minimart');
    expect(storage.length).toBe(0);
  });

  it('requires an active namespace', () => {
    setActiveNamespace(null);
    expect(() => readCollection('product')).toThrow('Chưa chọn ngành hàng');
  });
});
