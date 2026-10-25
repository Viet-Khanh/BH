import { afterEach, expect, it } from 'vitest';
import { setEdition } from '../../editions/editionRuntime.js';
import { getDefaultSettings } from '../settingsDefaults.js';

afterEach(() => setEdition('nhomkinh'));

it('derives shop name and template from the current edition', () => {
  expect(getDefaultSettings().shopName).toBe('Cửa hàng nhôm kính');
  setEdition('minimart');
  const settings = getDefaultSettings();
  expect(settings.shopName).toBe('Cửa hàng tạp hoá');
  expect(settings.invoiceTemplateHtml).toContain('HÀNG TIÊU DÙNG');
  expect(settings).toMatchObject({
    id: 'main',
    printCopies: 1,
    dataVersion: 2,
  });
});
