import { afterEach, expect, it } from 'vitest';
import { DEFAULT_EDITION_ID } from '../editionIds.js';
import { getEdition, hasFeature, setEdition } from '../editionRuntime.js';

afterEach(() => setEdition(DEFAULT_EDITION_ID));

it('defaults to the aluminium/glass edition', () => {
  expect(getEdition().id).toBe('nhomkinh');
  expect(hasFeature('dimensions')).toBe(true);
});

it('switches edition at runtime', () => {
  setEdition('pharmacy');
  expect(getEdition().id).toBe('pharmacy');
  expect(hasFeature('dimensions')).toBe(false);
});

it('rejects unknown ids and keeps the current edition', () => {
  expect(() => setEdition('nope')).toThrow('Unknown edition "nope"');
  expect(getEdition().id).toBe('nhomkinh');
});
