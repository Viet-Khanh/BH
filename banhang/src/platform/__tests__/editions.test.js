import { afterEach, describe, expect, it } from 'vitest';
import { EDITION_IDS } from '../../editions/catalog.js';
import {
  getActiveModule,
  getAvailableEditions,
  getEditionConfig,
  hasFeature,
  setActiveEdition,
} from '../moduleRuntime.js';

const TEXT_FIELDS = [
  'name',
  'tagline',
  'appTitle',
  'defaultShopName',
  'invoiceTagline',
];

afterEach(() => setActiveEdition('nhomkinh'));

describe.each(getAvailableEditions())('edition $id', (edition) => {
  it('has a complete config', () => {
    expect(edition.kind).toBe('edition');
    TEXT_FIELDS.forEach((key) =>
      expect(edition.config[key]).toEqual(expect.any(String))
    );
    expect(edition.config.features).toEqual({
      dimensions: expect.any(Boolean),
      sampleData: expect.any(Boolean),
    });
    expect(edition.config.labels).toEqual({
      group: expect.any(String),
      spec: expect.any(String),
    });
  });
});

it('matches the catalog order', () => {
  expect(getAvailableEditions().map((edition) => edition.id)).toEqual(
    EDITION_IDS
  );
});

it('keeps the legacy aluminium/glass edition as default', () => {
  expect(getActiveModule().editionId).toBe('nhomkinh');
  expect(getEditionConfig()).toMatchObject({
    appTitle: 'PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT',
    defaultShopName: 'Cửa hàng nhôm kính',
    invoiceTagline:
      'CHUYÊN NHÔM - XINGFA - PMA - SHALUMI - KÍNH - TRẦN THẢ - ALU CÁC LOẠI',
    features: { dimensions: true, sampleData: true },
  });
});

it('switches edition in demo/test builds and rejects unknown ids', () => {
  setActiveEdition('pharmacy');
  expect(getActiveModule().editionId).toBe('pharmacy');
  expect(hasFeature('dimensions')).toBe(false);
  expect(() => setActiveEdition('nope')).toThrow('Unknown edition "nope"');
});
