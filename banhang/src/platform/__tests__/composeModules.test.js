import { expect, it } from 'vitest';
import { composeModules, deepMerge } from '../composeModules.js';
import { defineCustomer, defineEdition } from '../defineModule.js';
import { resolveSlotIn } from '../slots.js';

const Page = () => null;
const Table = () => null;

const edition = defineEdition({
  id: 'pharmacy',
  config: {
    appTitle: 'A',
    features: { dimensions: false, sampleData: false },
    labels: { spec: 'S', group: 'G' },
  },
  routes: [{ module: 'expiry', path: '/expiry', page: Page }],
  homeTiles: [{ module: 'expiry', label: 'HẠN DÙNG', to: '/expiry' }],
});

const customer = defineCustomer({
  id: 'ankhang',
  extends: 'pharmacy',
  config: { appTitle: 'B', labels: { spec: 'S2' } },
  hideModules: ['expiry', 'cashbook'],
  slots: { 'sales.itemsTable': Table },
});

it('deep merges plain objects and replaces the rest', () => {
  expect(deepMerge({ a: { b: 1, c: [1] } }, { a: { c: [2] }, d: 3 })).toEqual({
    a: { b: 1, c: [2] },
    d: 3,
  });
  expect(deepMerge({ a: 1 }, undefined)).toEqual({ a: 1 });
});

it('layers the customer over its edition', () => {
  const active = composeModules(edition, customer);
  expect(active).toMatchObject({
    editionId: 'pharmacy',
    customerId: 'ankhang',
  });
  expect(active.config).toEqual({
    appTitle: 'B',
    features: { dimensions: false, sampleData: false },
    labels: { spec: 'S2', group: 'G' },
  });
  expect(active.hiddenModules).toEqual(['expiry', 'cashbook']);
  expect(active.routes).toEqual([]);
  expect(active.homeTiles).toEqual([]);
});

it('works without a customer and rejects a foreign one', () => {
  const active = composeModules(edition);
  expect(active.customerId).toBeNull();
  expect(active.routes).toHaveLength(1);
  expect(active.homeTiles).toHaveLength(1);
  const other = defineCustomer({ id: 'x', extends: 'vlxd', config: {} });
  expect(() => composeModules(edition, other)).toThrow(
    'Customer "x" extends "vlxd", not "pharmacy"'
  );
});

it('resolves slots with core fallbacks', () => {
  const active = composeModules(edition, customer);
  expect(resolveSlotIn(active, 'sales.itemsTable', Page)).toBe(Table);
  expect(resolveSlotIn(active, 'print.itemColumns', Page)).toBe(Page);
  expect(() => resolveSlotIn(active, 'nope', Page)).toThrow(
    'Unknown slot "nope"'
  );
});
