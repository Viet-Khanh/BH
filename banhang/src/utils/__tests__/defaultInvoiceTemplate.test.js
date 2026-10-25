import { afterEach, expect, it } from 'vitest';
import { setEdition } from '../../editions/editionRuntime.js';
import { buildDefaultTemplate } from '../../features/settings/templates/defaultInvoiceTemplate.js';

afterEach(() => setEdition('nhomkinh'));

it('uses the current edition tagline', () => {
  expect(buildDefaultTemplate()).toContain('CHUYÊN NHÔM - XINGFA');
  setEdition('pharmacy');
  expect(buildDefaultTemplate()).toContain('THUỐC - VITAMIN - THIẾT BỊ Y TẾ');
  expect(buildDefaultTemplate()).not.toContain('XINGFA');
});
