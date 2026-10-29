import { describe, expect, it } from 'vitest';
import {
  DEFAULT_GROUP_KEY,
  SYSTEM_GROUPS,
  getVisibleGroups,
  resolveGroupKey,
} from '../systemGroups.js';

const keys = (groups) => groups.map((group) => group.key);

describe('SYSTEM_GROUPS', () => {
  it('lists the groups in menu order', () => {
    expect(keys(SYSTEM_GROUPS)).toEqual([
      'shop',
      'sales',
      'printing',
      'einvoice',
      'security',
      'data',
    ]);
    expect(SYSTEM_GROUPS.every((group) => group.label)).toBe(true);
  });

  it('defaults to the shop group', () => {
    expect(DEFAULT_GROUP_KEY).toBe('shop');
  });
});

describe('getVisibleGroups', () => {
  const groups = [
    { key: 'shop', label: 'Cửa hàng' },
    { key: 'extra', label: 'Thêm', flag: 'extraFlag' },
  ];

  it('keeps groups without a flag', () => {
    expect(keys(getVisibleGroups({}, groups))).toEqual(['shop']);
  });

  it('keeps flagged groups only when the flag is on', () => {
    expect(keys(getVisibleGroups({ extraFlag: true }, groups))).toEqual([
      'shop',
      'extra',
    ]);
    expect(keys(getVisibleGroups({ extraFlag: false }, groups))).toEqual([
      'shop',
    ]);
  });

  it('accepts a flag predicate', () => {
    const hasFlag = (name) => name === 'extraFlag';
    expect(keys(getVisibleGroups(hasFlag, groups))).toEqual(['shop', 'extra']);
  });

  it('shows every default group without flags', () => {
    expect(keys(getVisibleGroups())).toEqual(keys(SYSTEM_GROUPS));
  });
});

describe('resolveGroupKey', () => {
  const visible = getVisibleGroups();

  it('returns a visible key unchanged', () => {
    expect(resolveGroupKey('printing', visible)).toBe('printing');
  });

  it('falls back to shop for unknown, empty or hidden keys', () => {
    expect(resolveGroupKey('nope', visible)).toBe('shop');
    expect(resolveGroupKey(null, visible)).toBe('shop');
    expect(resolveGroupKey(undefined, visible)).toBe('shop');
    expect(resolveGroupKey('data', [{ key: 'shop' }])).toBe('shop');
  });
});
