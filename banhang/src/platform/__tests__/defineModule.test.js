import { expect, it } from 'vitest';
import { defineCustomer, defineEdition } from '../defineModule.js';

const config = { name: 'X' };

it('normalizes an edition', () => {
  expect(defineEdition({ id: 'x', config })).toMatchObject({
    kind: 'edition',
    id: 'x',
    routes: [],
    homeTiles: [],
    hideModules: [],
    slots: {},
  });
});

it('rejects invalid modules', () => {
  expect(() => defineEdition({ config })).toThrow('missing id');
  expect(() => defineEdition({ id: 'x' })).toThrow('missing config');
  expect(() => defineEdition({ id: 'x', config, extra: 1 })).toThrow(
    'Module "x": unknown key "extra"'
  );
  expect(() =>
    defineEdition({ id: 'x', config, slots: { 'nope.slot': () => null } })
  ).toThrow('unknown slot "nope.slot"');
  expect(() =>
    defineEdition({ id: 'x', config, routes: [{ path: '/a' }] })
  ).toThrow('route needs path and page');
  expect(() =>
    defineEdition({ id: 'x', config, homeTiles: [{ label: 'A' }] })
  ).toThrow('home tile needs module and label');
  expect(() => defineCustomer({ id: 'c', config })).toThrow(
    'missing "extends"'
  );
});
