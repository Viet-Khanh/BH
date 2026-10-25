import { expect, it } from 'vitest';
import { buildModulesSource } from '../modulesPlugin.js';

it('imports every edition and no customer for demo/test', () => {
  const source = buildModulesSource({ allEditions: true });
  expect(source).toContain('/src/editions/pharmacy/index.js');
  expect(source).toContain('/src/editions/nhomkinh/index.js');
  expect(source).not.toContain('/src/customers/');
  expect(source).toContain('export const selectable = true;');
});

it('imports only the selected edition and customer for real builds', () => {
  const source = buildModulesSource({ customer: 'example' });
  expect(source).toContain('/src/editions/nhomkinh/index.js');
  expect(source).toContain('/src/customers/example/index.js');
  expect(source).not.toContain('pharmacy');
  expect(source).toContain('export const selectable = false;');
});

it('fails on unknown ids', () => {
  expect(() => buildModulesSource({ edition: 'nope' })).toThrow(
    'Unknown edition'
  );
});
