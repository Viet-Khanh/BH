import { describe, expect, it } from 'vitest';
import { getUnitSwitchForKey } from '../unitSwitchKey.js';

const coca = {
  id: 'p1',
  unit: 'lon',
  units: [{ name: 'thùng', factor: 24 }],
};
const plain = { id: 'p2', unit: 'cái' };
const items = [{ productId: 'p2' }, { productId: 'p1', unitName: '' }];
const f4 = (extra = {}) => ({ key: 'F4', ...extra });

describe('getUnitSwitchForKey', () => {
  it('switches the last line to the next unit on F4', () => {
    expect(
      getUnitSwitchForKey(f4(), { items, products: [plain, coca] })
    ).toEqual({ index: 1, unitName: 'thùng' });
  });

  it('wraps back to the base unit', () => {
    const lines = [{ productId: 'p1', unitName: 'thùng' }];
    expect(
      getUnitSwitchForKey(f4(), { items: lines, products: [coca] })
    ).toEqual({ index: 0, unitName: '' });
  });

  it('ignores other keys, modifiers and open modals', () => {
    const state = { items, products: [coca] };
    expect(getUnitSwitchForKey({ key: 'F2' }, state)).toBeNull();
    expect(getUnitSwitchForKey(f4({ altKey: true }), state)).toBeNull();
    expect(getUnitSwitchForKey(f4({ ctrlKey: true }), state)).toBeNull();
    expect(getUnitSwitchForKey(f4({ metaKey: true }), state)).toBeNull();
    expect(getUnitSwitchForKey(f4(), { ...state, modalOpen: true })).toBeNull();
  });

  it('ignores lines without packaging units and empty tables', () => {
    expect(
      getUnitSwitchForKey(f4(), { items: [items[0]], products: [plain] })
    ).toBeNull();
    expect(
      getUnitSwitchForKey(f4(), { items: [], products: [coca] })
    ).toBeNull();
  });
});
