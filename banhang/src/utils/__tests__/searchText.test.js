import { describe, expect, it } from 'vitest';
import { buildSearchText, hasSearchMatch } from '../searchText.js';

describe('searchText', () => {
  const product = { name: 'Coca', units: [{ name: 'thùng', factor: 24 }] };

  it('flattens nested unit objects', () => {
    expect(buildSearchText(product)).not.toContain('[object Object]');
    expect(hasSearchMatch(product, 'thung')).toBe(true);
  });
});
