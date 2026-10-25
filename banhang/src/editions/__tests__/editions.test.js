import { describe, expect, it } from 'vitest';
import { EDITION_CONFIGS, EDITION_IDS, getEditionConfig } from '../index.js';
import { ALL_MODULES } from '../modules.js';

const TEXT_FIELDS = [
  'id',
  'name',
  'tagline',
  'appTitle',
  'defaultShopName',
  'invoiceTagline',
];

describe.each(EDITION_CONFIGS)('edition config $id', (edition) => {
  it('has every required field', () => {
    TEXT_FIELDS.forEach((key) =>
      expect(edition[key]).toEqual(expect.any(String))
    );
    expect(edition.features).toEqual({
      dimensions: expect.any(Boolean),
      sampleData: expect.any(Boolean),
    });
    expect(edition.labels.group).toBeTruthy();
    expect(edition.labels.spec).toBeTruthy();
    expect(edition.modules.length).toBeGreaterThan(0);
    edition.modules.forEach((module) => expect(ALL_MODULES).toContain(module));
  });
});

it('registers every id once, in order', () => {
  expect(EDITION_CONFIGS.map((edition) => edition.id)).toEqual(EDITION_IDS);
  expect(getEditionConfig('nope')).toBeNull();
});

it('keeps the legacy aluminium/glass behaviour as default edition', () => {
  const edition = getEditionConfig('nhomkinh');
  expect(edition.appTitle).toBe('PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT');
  expect(edition.defaultShopName).toBe('Cửa hàng nhôm kính');
  expect(edition.invoiceTagline).toBe(
    'CHUYÊN NHÔM - XINGFA - PMA - SHALUMI - KÍNH - TRẦN THẢ - ALU CÁC LOẠI'
  );
  expect(edition.features).toEqual({ dimensions: true, sampleData: true });
});
