import { afterEach, expect, it } from 'vitest';
import { setActiveEdition } from '../../platform/moduleRuntime.js';
import { buildDefaultTemplate } from '../../features/settings/templates/defaultInvoiceTemplate.js';

afterEach(() => setActiveEdition('nhomkinh'));

it('uses the current edition tagline', () => {
  expect(buildDefaultTemplate()).toContain('CHUYÊN NHÔM - XINGFA');
  setActiveEdition('pharmacy');
  expect(buildDefaultTemplate()).toContain('THUỐC - VITAMIN - THIẾT BỊ Y TẾ');
  expect(buildDefaultTemplate()).not.toContain('XINGFA');
});
