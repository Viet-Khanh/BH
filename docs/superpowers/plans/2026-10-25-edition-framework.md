# Edition Framework (2a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the frontend edition-aware (nhomkinh, vlxd, minimart, fashion, pharmacy) through a single config layer, without database or backend changes.

**Architecture:** `src/editions/` holds one config per edition plus a runtime (`getEdition`/`setEdition`) initialised from `VITE_EDITION` (real builds) or by the demo session. UI reads flags through `useEdition()`/`useEditionFeature()`; pure code reads `getEdition()`/`hasFeature()`. Length × width logic is consolidated in `utils/lineMeasure.js` so formulas stay edition-agnostic; only visibility depends on the edition. Oversized components are split into UI pieces plus hooks/pure helpers.

**Tech Stack:** React 18, Vite 5, Ant Design 5, Zustand, Vitest 3.

**Spec:** `docs/superpowers/specs/2026-10-25-edition-framework-design.md`

**Conventions:** `banhang/AGENT.md` (≤ 200 lines/file, logic outside JSX, hooks for stateful logic), Prettier (`singleQuote`, `semi`, `trailingComma: es5`). Run FE tests with `VITE_API_URL= npx vitest run` (local `.env` breaks two unrelated tests).

---

## File map

Create:
- `banhang/src/editions/{editionIds,modules,index,editionRuntime,useEdition}.js`
- `banhang/src/editions/{nhomkinh,vlxd,minimart,fashion,pharmacy}.js`
- `banhang/src/utils/{lineMeasure,measureFormat,htmlEscape,printItems,sampleInvoice}.js`
- `banhang/src/store/settingsDefaults.js`
- `banhang/src/components/invoice/itemsTable/{itemColumns.js,useCellEditing.js,confirmRemoveItem.js,EditableNumberCell.jsx,EditableTextCell.jsx,InvoiceItemRow.jsx,InvoiceItemsTable.jsx}`
- `banhang/src/components/invoice/productModal/{useProductModalFocus.js,useDebouncedProductSearch.js,useQuickCreateProduct.js,useAddShortcut.js,ProductInfoPanel.jsx,InvoiceProductModal.jsx}`
- `banhang/src/components/measure/MeasureCells.jsx`
- `banhang/src/pages/homeTiles.js`
- `banhang/src/demo/editions/nhomkinh/{index,products}.js`
- Tests next to each new module under `__tests__/`.

Delete:
- `banhang/src/components/invoice/{InvoiceItemsTable,InvoiceProductModal}.jsx` (moved)
- `banhang/src/pages/Reports/reportItemMeasure.js` (merged into utils)
- `banhang/src/constants/app.js`
- Dead: `banhang/src/pages/Purchases/{PurchaseItemsTable,PurchaseSearchModal,PurchaseTopSection,PurchaseHeader}.jsx`, `usePurchasesLogic.js`, `usePurchaseFilters.js`

Modify: `vite.config.js`, `index.html`, `main.jsx`, `App.jsx`, `pages/Home.jsx`, `pages/System/System.jsx`, `pages/Catalog/CatalogFormModal.jsx`, `store/settingsStore.js`, `features/settings/templates/defaultInvoiceTemplate.js`, `utils/renderTemplate.js`, `utils/computeProfitByDay.js`, `components/TemplateEditor.jsx`, `components/InvoiceEditor.jsx`, `components/invoice/{invoiceUtils,invoiceItemHandlers}.js`, `components/invoice/hooks/useInvoiceProductSelection.js`, `features/purchases/domain/purchasesDomain.js`, `features/purchases/screen/PurchasesScreen.jsx`, `pages/Purchases/{usePurchaseProductModal.js,PurchaseDetailModal.jsx}`, `pages/Reports/{ReportSalesInvoiceModal,ReportPurchaseInvoiceModal}.jsx`, `pages/Reports/reportSalesUtils.js`, demo files, docs.

---

### Task 1: Edition registry and runtime

**Files:** Create `src/editions/*`; Modify `vite.config.js`; Test `src/editions/__tests__/{editions,editionRuntime}.test.js`

- [ ] **Step 1: Write failing tests**

`src/editions/__tests__/editions.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { EDITION_CONFIGS, EDITION_IDS, getEditionConfig } from '../index.js';
import { ALL_MODULES } from '../modules.js';

const TEXT_FIELDS = ['id', 'name', 'tagline', 'appTitle', 'defaultShopName', 'invoiceTagline'];

describe.each(EDITION_CONFIGS)('edition config $id', (edition) => {
  it('has every required field', () => {
    TEXT_FIELDS.forEach((key) => expect(edition[key]).toEqual(expect.any(String)));
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
```

`src/editions/__tests__/editionRuntime.test.js`:
```js
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
```

- [ ] **Step 2: Run** `cd banhang && npx vitest run src/editions` → FAIL (modules missing).

- [ ] **Step 3: Implement**

`src/editions/editionIds.js`:
```js
// Plain id list: also imported by vite.config.js to validate VITE_EDITION.
export const EDITION_IDS = ['nhomkinh', 'vlxd', 'minimart', 'fashion', 'pharmacy'];
export const DEFAULT_EDITION_ID = 'nhomkinh';
```

`src/editions/modules.js`:
```js
// Home modules an edition can show; keys match pages/homeTiles.js.
export const ALL_MODULES = ['system', 'catalog', 'sales', 'purchases', 'cashbook', 'reports'];
```

`src/editions/nhomkinh.js`:
```js
import { ALL_MODULES } from './modules.js';

export default {
  id: 'nhomkinh',
  name: 'Nhôm kính / Sắt',
  tagline: 'Nhôm Xingfa, kính, sắt hộp — bán theo dài × rộng, công nợ thợ thi công.',
  appTitle: 'PHẦN MỀM BÁN HÀNG NHÔM KÍNH/SẮT',
  defaultShopName: 'Cửa hàng nhôm kính',
  invoiceTagline: 'CHUYÊN NHÔM - XINGFA - PMA - SHALUMI - KÍNH - TRẦN THẢ - ALU CÁC LOẠI',
  features: { dimensions: true, sampleData: true },
  modules: ALL_MODULES,
  labels: { group: 'Nhóm hàng', spec: 'Quy cách' },
};
```

`src/editions/vlxd.js`:
```js
import { ALL_MODULES } from './modules.js';

export default {
  id: 'vlxd',
  name: 'Vật liệu xây dựng',
  tagline: 'Sắt thép, xi măng, gạch, tôn — bán sỉ cho thầu thợ, công nợ nhiều.',
  appTitle: 'PHẦN MỀM BÁN HÀNG VẬT LIỆU XÂY DỰNG',
  defaultShopName: 'Cửa hàng vật liệu xây dựng',
  invoiceTagline: 'SẮT THÉP - XI MĂNG - GẠCH - CÁT ĐÁ - TÔN - ỐNG NHỰA - ĐIỆN NƯỚC',
  features: { dimensions: true, sampleData: false },
  modules: ALL_MODULES,
  labels: { group: 'Nhóm hàng', spec: 'Quy cách' },
};
```

`src/editions/minimart.js`:
```js
import { ALL_MODULES } from './modules.js';

export default {
  id: 'minimart',
  name: 'Tạp hoá / Minimart',
  tagline: 'Hàng tiêu dùng nhanh, nhiều mặt hàng, bán lẻ là chính.',
  appTitle: 'PHẦN MỀM BÁN HÀNG TẠP HOÁ - MINIMART',
  defaultShopName: 'Cửa hàng tạp hoá',
  invoiceTagline: 'HÀNG TIÊU DÙNG - ĐỒ UỐNG - THỰC PHẨM - HOÁ PHẨM',
  features: { dimensions: false, sampleData: false },
  modules: ALL_MODULES,
  labels: { group: 'Ngành hàng', spec: 'Quy cách' },
};
```

`src/editions/fashion.js`:
```js
import { ALL_MODULES } from './modules.js';

export default {
  id: 'fashion',
  name: 'Thời trang / Giày dép',
  tagline: 'Quần áo, giày dép, phụ kiện — bán lẻ tại quầy và bán sỉ cho shop.',
  appTitle: 'PHẦN MỀM BÁN HÀNG THỜI TRANG - GIÀY DÉP',
  defaultShopName: 'Shop thời trang',
  invoiceTagline: 'QUẦN ÁO - GIÀY DÉP - TÚI XÁCH - PHỤ KIỆN',
  features: { dimensions: false, sampleData: false },
  modules: ALL_MODULES,
  labels: { group: 'Danh mục', spec: 'Size / màu' },
};
```

`src/editions/pharmacy.js`:
```js
import { ALL_MODULES } from './modules.js';

export default {
  id: 'pharmacy',
  name: 'Nhà thuốc',
  tagline: 'Thuốc, vitamin, thiết bị y tế — bán lẻ và bán sỉ cho phòng khám.',
  appTitle: 'PHẦN MỀM BÁN HÀNG NHÀ THUỐC',
  defaultShopName: 'Nhà thuốc',
  invoiceTagline: 'THUỐC - VITAMIN - THIẾT BỊ Y TẾ',
  features: { dimensions: false, sampleData: false },
  modules: ALL_MODULES,
  labels: { group: 'Nhóm thuốc', spec: 'Quy cách đóng gói' },
};
```

`src/editions/index.js`:
```js
import { DEFAULT_EDITION_ID, EDITION_IDS } from './editionIds.js';
import fashion from './fashion.js';
import minimart from './minimart.js';
import nhomkinh from './nhomkinh.js';
import pharmacy from './pharmacy.js';
import vlxd from './vlxd.js';

const CONFIGS = { nhomkinh, vlxd, minimart, fashion, pharmacy };

// Ordered like EDITION_IDS (also the demo picker order).
export const EDITION_CONFIGS = EDITION_IDS.map((id) => CONFIGS[id]);

export const getEditionConfig = (editionId) => CONFIGS[editionId] || null;

export { DEFAULT_EDITION_ID, EDITION_IDS };
```

`src/editions/editionRuntime.js`:
```js
import { DEFAULT_EDITION_ID, getEditionConfig } from './index.js';

let current = null;

const requireConfig = (editionId) => {
  const config = getEditionConfig(editionId);
  if (!config) throw new Error(`Unknown edition "${editionId}"`);
  return config;
};

// Real builds: fixed by VITE_EDITION. Demo: set once by the demo session before <App/> renders.
export const getEdition = () => {
  if (!current) {
    current = requireConfig(import.meta.env.VITE_EDITION || DEFAULT_EDITION_ID);
  }
  return current;
};

export const setEdition = (editionId) => {
  current = requireConfig(editionId);
  return current;
};

export const hasFeature = (name) => Boolean(getEdition().features[name]);

export const applyEditionToDocument = (edition = getEdition()) => {
  if (typeof document !== 'undefined') document.title = edition.appTitle;
};
```

`src/editions/useEdition.js`:
```js
import { getEdition, hasFeature } from './editionRuntime.js';

// The edition never changes while a page is open (the demo reloads on switch),
// so these hooks read the runtime directly without subscriptions.
export const useEdition = () => getEdition();

export const useEditionFeature = (name) => hasFeature(name);
```

`vite.config.js` — switch to `loadEnv` and validate:
```js
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { EDITION_IDS } from './src/editions/editionIds.js';

const fromHere = (path) => fileURLToPath(new URL(path, import.meta.url));

const assertKnownEdition = (edition) => {
  if (edition && !EDITION_IDS.includes(edition)) {
    throw new Error(
      `Unknown VITE_EDITION "${edition}". Use one of: ${EDITION_IDS.join(', ')}`
    );
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  assertKnownEdition(env.VITE_EDITION);
  return {
    plugins: [react()],
    base: process.env.ELECTRON ? './' : '/',
    define: {
      // Build-time flag. Demo code is only reachable behind `if (__DEMO__)`.
      __DEMO__: JSON.stringify(env.VITE_DEMO === 'true'),
    },
    resolve: {
      alias: {
        '@backend': fromHere('../banhang-backend/src'),
        // The frontend never imports these; only backend code reached by the demo does.
        express: fromHere('./src/demo/shims/express.js'),
        mongoose: fromHere('./src/demo/shims/mongoose.js'),
      },
      // Backend files must use banhang's copies (banhang-backend/node_modules is absent on Vercel).
      dedupe: ['dayjs', 'uuid'],
    },
    server: {
      fs: { allow: [fromHere('..')] },
    },
  };
});
```

- [ ] **Step 4: Run** `npx vitest run src/editions` → PASS (5 + 3 + 3 tests). Run `VITE_EDITION=nope npx vite build` → fails with `Unknown VITE_EDITION "nope"`.
- [ ] **Step 5: Commit** `feat(editions): add edition registry and runtime`.

---

### Task 2: Shared length × width helpers

**Files:** Create `utils/lineMeasure.js`, `utils/measureFormat.js`; Modify `invoiceUtils.js`, `invoiceItemHandlers.js`, `useInvoiceProductSelection.js`, `purchasesDomain.js`, `usePurchaseProductModal.js`, `reportSalesUtils.js`, `computeProfitByDay.js`; Test `utils/__tests__/{lineMeasure,measureFormat}.test.js`

- [ ] **Step 1: Write failing tests**

`utils/__tests__/lineMeasure.test.js`:
```js
import { expect, it } from 'vitest';
import {
  getAreaMultiplier,
  getLineAmount,
  getMeasuredQty,
  hasDimensions,
  normalizeDimension,
  readDimensions,
} from '../lineMeasure.js';

it('normalizes dimensions to positive numbers or null', () => {
  expect(normalizeDimension('2.5')).toBe(2.5);
  expect(normalizeDimension(0)).toBeNull();
  expect(normalizeDimension(-1)).toBeNull();
  expect(normalizeDimension(undefined)).toBeNull();
});

it('treats items without both dimensions as plain quantity', () => {
  expect(hasDimensions({ length: 2 })).toBe(false);
  expect(getAreaMultiplier({ length: 2 })).toBe(1);
  expect(getMeasuredQty({ qty: 3 })).toBe(3);
  expect(getLineAmount({ qty: 3, unitPrice: 1000 })).toBe(3000);
});

it('multiplies by area when both dimensions are set', () => {
  const item = { qty: 2, length: 1.5, width: 2, unitPrice: 1000, unitCost: 800 };
  expect(hasDimensions(item)).toBe(true);
  expect(getMeasuredQty(item)).toBe(6);
  expect(getLineAmount(item)).toBe(6000);
  expect(getLineAmount(item, 'unitCost')).toBe(4800);
});

it('requires both dimensions or neither', () => {
  expect(readDimensions(2, null).error).toMatch('chiều dài và chiều rộng');
  expect(readDimensions(2, 3)).toEqual({ length: 2, width: 3, error: null });
  expect(readDimensions(null, 0)).toEqual({ length: null, width: null, error: null });
});
```

`utils/__tests__/measureFormat.test.js`:
```js
import { expect, it } from 'vitest';
import { formatDimension, formatMeasure, isEmptyValue } from '../measureFormat.js';

it('formats measures with up to 3 decimals', () => {
  expect(formatMeasure(1234.5678)).toBe('1.234,568');
  expect(formatMeasure(null)).toBe('0');
});

it('supports blank output for empty or zero values', () => {
  expect(formatMeasure('', { blankOnEmpty: true })).toBe('');
  expect(formatMeasure(0, { blankOnZero: true })).toBe('');
  expect(isEmptyValue(undefined)).toBe(true);
});

it('formats dimensions only when positive', () => {
  expect(formatDimension(2.4)).toBe('2,4');
  expect(formatDimension(0)).toBe('');
});
```

- [ ] **Step 2: Run** `npx vitest run src/utils/__tests__/lineMeasure.test.js src/utils/__tests__/measureFormat.test.js` → FAIL.

- [ ] **Step 3: Implement**

`utils/lineMeasure.js`:
```js
// Length × width (Dài × Rộng) helpers. Items without both dimensions behave as a
// plain quantity, so formulas need no edition check: editions without the
// dimensions feature simply never set them.
export const normalizeDimension = (value) => {
  const number = Number(value || 0);
  return number > 0 ? number : null;
};

export const hasDimensions = (item = {}) =>
  Boolean(normalizeDimension(item.length) && normalizeDimension(item.width));

export const getAreaMultiplier = (item = {}) =>
  hasDimensions(item) ? Number(item.length) * Number(item.width) : 1;

export const getMeasuredQty = (item = {}) =>
  Number(item.qty || 0) * getAreaMultiplier(item);

export const getLineAmount = (item = {}, priceField = 'unitPrice') =>
  Number(item.qty || 0) * Number(item[priceField] || 0) * getAreaMultiplier(item);

// Both dimensions or neither. Returns normalized values and a user-facing error.
export const readDimensions = (length, width) => {
  const normalized = {
    length: normalizeDimension(length),
    width: normalizeDimension(width),
  };
  const error =
    Boolean(normalized.length) === Boolean(normalized.width)
      ? null
      : 'Vui lòng nhập đủ chiều dài và chiều rộng.';
  return { ...normalized, error };
};
```

`utils/measureFormat.js`:
```js
const numberFormat = new Intl.NumberFormat('vi-VN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export const isEmptyValue = (value) =>
  value === null || value === undefined || value === '';

export const formatMeasure = (
  value,
  { blankOnEmpty = false, blankOnZero = false } = {}
) => {
  if (blankOnEmpty && isEmptyValue(value)) return '';
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '';
  if (blankOnZero && number === 0) return '';
  return numberFormat.format(number);
};

export const formatDimension = (value) => {
  const number = Number(value || 0);
  return number > 0 ? formatMeasure(number) : '';
};
```

Replace the duplicates:
- `components/invoice/invoiceUtils.js`: delete `isGlassProduct` (unused) and `getLineBase`.
- `components/invoice/hooks/useInvoiceProductSelection.js`: import `getLineAmount` from `../../../utils/lineMeasure.js` instead of `getLineBase`; in `updateItem` drop the product lookup and write `nextItem.lineTotal = getLineAmount(nextItem);`; dependencies `[items, setItems]`.
- `components/invoice/invoiceItemHandlers.js`: delete `getValidDimension`; replace the dimension block and total with
  ```js
  const dimensions = readDimensions(pendingLength, pendingWidth);
  if (dimensions.error) {
    message.error(dimensions.error);
    return false;
  }
  const lineTotal = getLineAmount({ qty, unitPrice, ...dimensions });
  ```
  and use `length: dimensions.length, width: dimensions.width` in `newItem`.
- `features/purchases/domain/purchasesDomain.js`: `export const getPurchaseLineTotal = (item = {}) => getLineAmount(item, 'unitCost');` and in `normalizePurchaseItem` use `length: normalizeDimension(item.length), width: normalizeDimension(item.width)`.
- `pages/Purchases/usePurchaseProductModal.js`: delete `getValidDimension`; use `readDimensions` exactly as in `invoiceItemHandlers` (error → `message.error`, return false), then `length: dimensions.length, width: dimensions.width`.
- `pages/Reports/reportSalesUtils.js`: delete local `getAreaMultiplier`, import it from `../../utils/lineMeasure.js`.
- `utils/computeProfitByDay.js`: replace the three length/width/area lines with `const area = getAreaMultiplier(item);` (import from `./lineMeasure.js`).

- [ ] **Step 4: Run** `VITE_API_URL= npx vitest run` → all pass.
- [ ] **Step 5: Commit** `refactor: consolidate length x width helpers`.

---

### Task 3: Edition-aware printing

**Files:** Create `utils/htmlEscape.js`, `utils/printItems.js`, `utils/sampleInvoice.js`; Modify `utils/renderTemplate.js`, `features/settings/templates/defaultInvoiceTemplate.js`, `components/TemplateEditor.jsx`, `utils/__tests__/renderTemplate.test.js`; Test `utils/__tests__/{printItems,sampleInvoice,defaultInvoiceTemplate}.test.js`

- [ ] **Step 1: Write failing tests**

`utils/__tests__/printItems.test.js`:
```js
import { describe, expect, it } from 'vitest';
import { buildItemsHtml } from '../printItems.js';

const products = [{ id: 'p1', name: 'Kính <8ly>', unit: 'm2' }];
const items = [
  { productId: 'p1', qty: 2, length: 1.5, width: 2, unitPrice: 1000, lineTotal: 6000 },
  { productId: 'p1', qty: 1, unitPrice: 1000, lineTotal: 1000, lineNote: 'cắt góc' },
];

const headers = (html) => [...html.matchAll(/<th[^>]*>([^<]*)<\/th>/g)].map((m) => m[1]);

describe('buildItemsHtml', () => {
  it('prints dimension columns when enabled', () => {
    const html = buildItemsHtml(items, products, { dimensions: true });
    expect(headers(html)).toEqual(['TT', 'Tên hàng', 'ĐVT', 'SL', 'D', 'R', 'M2', 'Đơn giá', 'Thành tiền']);
    expect(html).toContain('>6<');
  });

  it('omits dimension columns when disabled', () => {
    const html = buildItemsHtml(items, products, { dimensions: false });
    expect(headers(html)).toEqual(['TT', 'Tên hàng', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền']);
  });

  it('escapes names, prints repeated product names once and keeps notes', () => {
    const html = buildItemsHtml(items, products, { dimensions: false });
    expect(html.match(/Kính &lt;8ly&gt;/g)).toHaveLength(1);
    expect(html).toContain('cắt góc');
  });
});
```

`utils/__tests__/sampleInvoice.test.js`:
```js
import { expect, it } from 'vitest';
import { buildSampleInvoice } from '../sampleInvoice.js';

const product = { id: 'p1', sellPriceDefault: 1000 };

it('builds a dimensioned sample when the edition sells by area', () => {
  const invoice = buildSampleInvoice(product, { dimensions: true });
  expect(invoice.items[0]).toMatchObject({ length: 2.4, width: 1.2 });
  expect(invoice.total).toBeCloseTo(2880);
});

it('builds a plain sample otherwise, or none without products', () => {
  expect(buildSampleInvoice(product, { dimensions: false }).total).toBe(1000);
  expect(buildSampleInvoice(undefined, { dimensions: false }).items).toEqual([]);
});
```

`utils/__tests__/defaultInvoiceTemplate.test.js`:
```js
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
```

- [ ] **Step 2: Run** → FAIL.

- [ ] **Step 3: Implement**

`utils/htmlEscape.js`:
```js
export const escapeHtml = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
```

`utils/printItems.js`:
```js
import { hasFeature } from '../editions/editionRuntime.js';
import { escapeHtml } from './htmlEscape.js';
import { getMeasuredQty, hasDimensions } from './lineMeasure.js';
import { formatMeasure } from './measureFormat.js';
import { formatRoundedMoney } from './moneyFormat.js';

const STYLES = {
  index: 'width:30px;text-align:center;',
  name: 'width:38%;text-align:left;overflow-wrap:anywhere;',
  unit: 'width:44px;text-align:center;',
  qty: 'width:56px;text-align:center;',
  dimension: 'width:44px;text-align:center;',
  areaQty: 'width:66px;text-align:right;',
  money: 'width:92px;text-align:right;',
  total: 'width:100px;text-align:right;',
};

const measure = (value) => formatMeasure(value, { blankOnZero: true });
const onlyMeasured = (pick) => (row) => (row.measured ? measure(pick(row.item)) : '');

const DIMENSION_COLUMNS = [
  { title: 'D', style: STYLES.dimension, cell: onlyMeasured((item) => item.length) },
  { title: 'R', style: STYLES.dimension, cell: onlyMeasured((item) => item.width) },
  { title: 'M2', style: STYLES.areaQty, cell: onlyMeasured(getMeasuredQty) },
];

// Columns of the {{items}} table; dimension columns follow the edition flag.
export const buildPrintItemColumns = ({ dimensions }) => [
  { title: 'TT', style: STYLES.index, cell: (row) => String(row.index + 1) },
  { title: 'Tên hàng', style: STYLES.name, cell: (row) => row.nameHtml },
  { title: 'ĐVT', style: STYLES.unit, cell: (row) => escapeHtml(row.unit) },
  { title: 'SL', style: STYLES.qty, cell: (row) => measure(row.item.qty) },
  ...(dimensions ? DIMENSION_COLUMNS : []),
  { title: 'Đơn giá', style: STYLES.money, cell: (row) => formatRoundedMoney(row.item.unitPrice) },
  { title: 'Thành tiền', style: STYLES.total, cell: (row) => formatRoundedMoney(row.item.lineTotal) },
];

const resolveName = (item, product) => (product ? product.name : item?.name || 'Sản phẩm');

const productKey = (item, product) =>
  item?.productId || (product || item?.name ? resolveName(item, product) : '');

const buildNameHtml = (name, note, hideName) => {
  const nameHtml = hideName
    ? ''
    : `<div class="item-name" style="font-weight:500;color:#444;">${escapeHtml(name)}</div>`;
  const noteHtml = note ? `<div class="item-note">${escapeHtml(note)}</div>` : '';
  return `${nameHtml}${noteHtml}`;
};

// Consecutive lines of the same product print the name once.
export const buildPrintRows = (items = [], products = []) => {
  const findProduct = (item) => products.find((p) => p.id === item?.productId);
  return items.map((item, index) => {
    const product = findProduct(item);
    const previous = items[index - 1];
    const key = productKey(item, product);
    const sameAsPrevious = Boolean(
      previous && key && key === productKey(previous, findProduct(previous))
    );
    return {
      index,
      item,
      unit: product?.unit || '',
      measured: hasDimensions(item),
      nameHtml: buildNameHtml(resolveName(item, product), item.lineNote, sameAsPrevious),
    };
  });
};

export const buildItemsHtml = (
  items = [],
  products = [],
  { dimensions = hasFeature('dimensions') } = {}
) => {
  const columns = buildPrintItemColumns({ dimensions });
  const header = columns
    .map((column) => `<th style="${column.style}">${column.title}</th>`)
    .join('');
  const body = buildPrintRows(items, products)
    .map((row) => {
      const cells = columns
        .map((column) => `<td style="${column.style}">${column.cell(row)}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<table class="items"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
};
```

`utils/sampleInvoice.js`:
```js
import { getLineAmount } from './lineMeasure.js';

const SAMPLE_DIMENSIONS = { length: 2.4, width: 1.2 };

// Preview data for the invoice template editor.
export const buildSampleInvoice = (product, { dimensions, now = new Date() }) => {
  const items = product
    ? [
        {
          productId: product.id,
          qty: 1,
          unitPrice: product.sellPriceDefault || 50000,
          discount: 0,
          ...(dimensions ? SAMPLE_DIMENSIONS : {}),
        },
      ].map((item) => ({ ...item, lineTotal: getLineAmount(item) }))
    : [];
  return {
    code: 'INV-20240101-001',
    date: now.toISOString(),
    note: 'Ghi chu da luu',
    printNote: 'Luu y chi dung khi in',
    items,
    total: items.reduce((sum, item) => sum + item.lineTotal, 0),
  };
};
```

`utils/renderTemplate.js`: delete `escapeHtml`, `formatMeasure`, `itemColumnStyles` and `buildItemsHtml`; add
```js
import { escapeHtml } from './htmlEscape.js';
import { buildItemsHtml } from './printItems.js';

export { buildItemsHtml } from './printItems.js';
```
Keep `renderInvoiceTemplate` unchanged (it already calls `buildItemsHtml(items, products || [])`).

`features/settings/templates/defaultInvoiceTemplate.js`: turn the constant into a function. Line 1 becomes
```js
import { getEdition } from '../../../editions/editionRuntime.js';

// Function, not a constant: the demo chooses the edition after modules load.
// The tagline is trusted config text (src/editions), not user input.
export const buildDefaultTemplate = (tagline = getEdition().invoiceTagline) => `
```
the hard-coded tagline line becomes `<div class="shop-line">${tagline}</div>`, and the closing `` `; `` stays.

`components/TemplateEditor.jsx`: replace the `sampleInvoice` `useMemo` body with
```js
  const dimensions = useEditionFeature('dimensions');
  const sampleInvoice = useMemo(
    () => buildSampleInvoice(products[0], { dimensions }),
    [products, dimensions]
  );
```
(imports: `useEditionFeature` from `../editions/useEdition.js`, `buildSampleInvoice` from `../utils/sampleInvoice.js`; drop `dayjs`).

`utils/__tests__/renderTemplate.test.js`: import `buildDefaultTemplate` and use `template: buildDefaultTemplate()`.

- [ ] **Step 4: Run** `VITE_API_URL= npx vitest run` → all pass.
- [ ] **Step 5: Commit** `feat(print): edition-aware invoice items and default template`.

---

### Task 4: Lazy, edition-aware default settings

**Files:** Create `store/settingsDefaults.js`; Modify `store/settingsStore.js`; Test `store/__tests__/settingsDefaults.test.js`

- [ ] **Step 1: Test**
```js
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
  expect(settings).toMatchObject({ id: 'main', printCopies: 1, dataVersion: 2 });
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `store/settingsDefaults.js`:
```js
import { getEdition } from '../editions/editionRuntime.js';
import { buildDefaultTemplate } from '../features/settings/templates/defaultInvoiceTemplate.js';

// Function, not a constant: the demo chooses the edition after modules load.
export const getDefaultSettings = () => ({
  id: 'main',
  shopName: getEdition().defaultShopName,
  shopPhone: '0900 000 000',
  shopAddress: '123 Đường ABC, Quận 1',
  allowNegativeStock: false,
  autoUpdateAvgCostOnPurchase: true,
  showSensitiveInfo: false,
  lowStockThreshold: 5,
  printCopies: 1,
  invoiceTemplateHtml: buildDefaultTemplate(),
  dataVersion: 2,
});
```
In `store/settingsStore.js`: delete `DEFAULT_SETTINGS` and the template import; import `getDefaultSettings`; in `normalizeSettings` start with `const defaults = getDefaultSettings();` and use `defaults` for the spread, the empty-template fallback (`defaults.invoiceTemplateHtml`) and `defaults.printCopies`; initial state `settings: getDefaultSettings()`; in `ensureDefaults` and `reset` use `const defaults = getDefaultSettings();` then `saveSettings(defaults)` / `set({ settings: defaults })`.
- [ ] **Step 4: Run** all tests → PASS. **Step 5: Commit** `feat(settings): derive defaults from the edition`.

---

### Task 5: Split the invoice items table

**Files:** Create `components/invoice/itemsTable/*`; Delete `components/invoice/InvoiceItemsTable.jsx`; Modify `components/InvoiceEditor.jsx`, `features/purchases/screen/PurchasesScreen.jsx`; Test `components/invoice/itemsTable/__tests__/itemColumns.test.js`

- [ ] **Step 1: Test**
```js
import { expect, it } from 'vitest';
import { buildItemColumns } from '../itemColumns.js';

const labels = { qtyLabel: 'SL', totalQtyLabel: 'Tổng Sl/m2', priceLabel: 'Đơn giá' };
const keys = (columns) => columns.map((column) => column.key);

it('includes dimension and measured columns when enabled', () => {
  const columns = buildItemColumns({ ...labels, showDimensions: true, showTotalQty: true });
  expect(keys(columns)).toEqual(['index', 'name', 'unit', 'length', 'width', 'qty', 'measuredQty', 'price', 'lineTotal', 'note', 'actions']);
  expect(columns.find((column) => column.key === 'measuredQty').title).toBe('Tổng Sl/m2');
});

it('drops them when dimensions are off', () => {
  const columns = buildItemColumns({ ...labels, showDimensions: false, showTotalQty: true });
  expect(keys(columns)).toEqual(['index', 'name', 'unit', 'qty', 'price', 'lineTotal', 'note', 'actions']);
});
```
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement**

`itemColumns.js`:
```js
// Ordered columns of the invoice/purchase items table. Pure data: header titles
// and the cell renderer key used by InvoiceItemRow.
export const buildItemColumns = ({
  showDimensions,
  showTotalQty,
  qtyLabel,
  totalQtyLabel,
  priceLabel,
}) => [
  { key: 'index', title: 'STT' },
  { key: 'name', title: 'Tên hàng' },
  { key: 'unit', title: 'ĐVT' },
  ...(showDimensions
    ? [
        { key: 'length', title: 'Dài' },
        { key: 'width', title: 'Rộng' },
      ]
    : []),
  { key: 'qty', title: qtyLabel },
  ...(showDimensions && showTotalQty
    ? [{ key: 'measuredQty', title: totalQtyLabel }]
    : []),
  { key: 'price', title: priceLabel },
  { key: 'lineTotal', title: 'Thành tiền' },
  { key: 'note', title: 'Ghi chú' },
  { key: 'actions', title: '' },
];
```

`useCellEditing.js`:
```js
import { useEffect, useRef } from 'react';

const getEditKey = (rowIndex, field) => `${rowIndex}:${field}`;

// Tracks whether a cell is in edit mode and focuses/selects its input when it is.
export const useCellEditing = ({ rowIndex, field, editingCell, setEditingCell }) => {
  const inputRef = useRef(null);
  const editKey = getEditKey(rowIndex, field);
  const isEditing = editingCell === editKey;

  useEffect(() => {
    if (!isEditing) return;
    requestAnimationFrame(() => {
      inputRef.current?.focus?.({ cursor: 'all' });
      inputRef.current?.select?.();
    });
  }, [isEditing]);

  return {
    inputRef,
    isEditing,
    startEditing: () => setEditingCell(editKey),
    stopEditing: () => setEditingCell(null),
  };
};
```

`confirmRemoveItem.js`:
```js
import { Modal } from 'antd';

export const confirmRemoveItem = ({ productName, onConfirm }) => {
  Modal.confirm({
    title: 'Xóa sản phẩm khỏi hóa đơn?',
    content: productName ? `Sản phẩm: ${productName}` : undefined,
    okText: 'Xóa',
    cancelText: 'Hủy',
    okButtonProps: { danger: true },
    onOk: onConfirm,
  });
};
```

`EditableNumberCell.jsx`:
```jsx
import { InputNumber } from 'antd';
import { isEmptyValue } from '../../../utils/measureFormat.js';
import { useCellEditing } from './useCellEditing.js';

const EditableNumberCell = ({
  rowIndex,
  field,
  value,
  displayValue,
  className = '',
  placeholder = '',
  readOnly,
  editingCell,
  setEditingCell,
  onUpdate,
  inputProps = {},
}) => {
  const { inputRef, isEditing, startEditing, stopEditing } = useCellEditing({
    rowIndex,
    field,
    editingCell,
    setEditingCell,
  });

  if (readOnly) {
    return <span className={className}>{displayValue || placeholder}</span>;
  }

  if (isEditing) {
    return (
      <InputNumber
        ref={inputRef}
        className="editable-input"
        style={{ width: '100%' }}
        value={isEmptyValue(value) ? undefined : value}
        onChange={(nextValue) => onUpdate(rowIndex, field, nextValue)}
        onBlur={stopEditing}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') stopEditing();
        }}
        {...inputProps}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-cell ${className}${displayValue ? '' : ' is-empty'}`}
      onClick={startEditing}
    >
      {displayValue || placeholder}
    </button>
  );
};

export default EditableNumberCell;
```

`EditableTextCell.jsx`:
```jsx
import { Input } from 'antd';
import { useCellEditing } from './useCellEditing.js';

const EditableTextCell = ({
  rowIndex,
  field,
  value,
  placeholder = 'Ghi chú',
  readOnly,
  editingCell,
  setEditingCell,
  onUpdate,
}) => {
  const { inputRef, isEditing, startEditing, stopEditing } = useCellEditing({
    rowIndex,
    field,
    editingCell,
    setEditingCell,
  });
  const displayValue = value?.trim?.() || '';

  if (readOnly) return <span>{displayValue}</span>;

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        className="editable-input"
        value={value || ''}
        onChange={(event) => onUpdate(rowIndex, field, event.target.value)}
        onBlur={stopEditing}
        onPressEnter={stopEditing}
      />
    );
  }

  return (
    <button
      type="button"
      className={`editable-cell editable-cell-note${displayValue ? '' : ' is-empty'}`}
      onClick={startEditing}
    >
      {displayValue || placeholder}
    </button>
  );
};

export default EditableTextCell;
```

`InvoiceItemRow.jsx`:
```jsx
import { Button } from 'antd';
import { getMeasuredQty } from '../../../utils/lineMeasure.js';
import { formatMeasure } from '../../../utils/measureFormat.js';
import { formatMoney } from '../../../utils/moneyFormat.js';
import { formatNumberInput, parseNumberInput } from '../../../utils/numberInput.js';
import EditableNumberCell from './EditableNumberCell.jsx';
import EditableTextCell from './EditableTextCell.jsx';

const numberCell = (row, field, cellProps) => (
  <td className="pos-cell-number">
    <EditableNumberCell
      rowIndex={row.index}
      field={field}
      value={row.item[field]}
      className="numeric"
      {...row.editing}
      {...cellProps}
    />
  </td>
);

const dimensionCell = (field) => (row) =>
  numberCell(row, field, {
    displayValue: formatMeasure(row.item[field], { blankOnEmpty: true }),
    placeholder: '-',
    inputProps: { min: 0 },
  });

// One renderer per column key from itemColumns.js.
const CELL_RENDERERS = {
  index: (row) => <td className="pos-cell-center">{row.index + 1}</td>,
  name: ({ product }) => (
    <td>
      <div>
        <strong>{product?.name || 'Sản phẩm'}</strong>
      </div>
      <div className="pos-product-code">{product?.code || ''}</div>
    </td>
  ),
  unit: ({ product }) => <td>{product?.unit || ''}</td>,
  length: dimensionCell('length'),
  width: dimensionCell('width'),
  qty: (row) => numberCell(row, 'qty', { displayValue: formatMeasure(row.item.qty) }),
  measuredQty: ({ item }) => (
    <td className="pos-cell-number">{formatMeasure(getMeasuredQty(item))}</td>
  ),
  price: (row) => (
    <td className="pos-cell-money">
      <EditableNumberCell
        rowIndex={row.index}
        field={row.priceField}
        value={row.item[row.priceField]}
        displayValue={formatMoney(row.item[row.priceField])}
        className="numeric"
        {...row.editing}
        inputProps={{ min: row.priceMin, formatter: formatNumberInput, parser: parseNumberInput }}
      />
    </td>
  ),
  lineTotal: ({ item }) => <td className="pos-cell-money">{formatMoney(item.lineTotal)}</td>,
  note: (row) => (
    <td>
      <EditableTextCell rowIndex={row.index} field="lineNote" value={row.item.lineNote} {...row.editing} />
    </td>
  ),
  actions: (row) => (
    <td className="pos-cell-actions">
      {!row.editing.readOnly && (
        <Button danger size="small" onClick={row.onRemove}>
          Xóa
        </Button>
      )}
    </td>
  ),
};

const InvoiceItemRow = ({ columns, ...row }) => (
  <tr>
    {columns.map((column) => (
      <CellSlot key={column.key} render={CELL_RENDERERS[column.key]} row={row} />
    ))}
  </tr>
);

const CellSlot = ({ render, row }) => render(row);

export default InvoiceItemRow;
```

`InvoiceItemsTable.jsx`:
```jsx
import { useState } from 'react';
import { useEditionFeature } from '../../../editions/useEdition.js';
import { confirmRemoveItem } from './confirmRemoveItem.js';
import InvoiceItemRow from './InvoiceItemRow.jsx';
import { buildItemColumns } from './itemColumns.js';

// Shared by sales and purchases. showDimensions defaults to the edition flag.
const InvoiceItemsTable = ({
  items,
  products,
  onUpdateItem,
  onRemoveItem,
  showDimensions,
  priceField = 'unitPrice',
  priceLabel = 'Đơn giá',
  qtyLabel = 'SL',
  totalQtyLabel = 'Tổng Sl/m2',
  showTotalQty = true,
  priceMin = 0,
  readOnly = false,
}) => {
  const editionDimensions = useEditionFeature('dimensions');
  const [editingCell, setEditingCell] = useState(null);
  const columns = buildItemColumns({
    showDimensions: showDimensions ?? editionDimensions,
    showTotalQty,
    qtyLabel,
    totalQtyLabel,
    priceLabel,
  });
  const editing = { readOnly, editingCell, setEditingCell, onUpdate: onUpdateItem };

  return (
    <div className="pos-table invoice-edit-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const product = products.find((p) => p.id === item.productId);
            const onRemove = () =>
              confirmRemoveItem({
                productName: product?.name,
                onConfirm: () => onRemoveItem(index),
              });
            return (
              <InvoiceItemRow
                key={`${item.productId}-${index}`}
                columns={columns}
                item={item}
                index={index}
                product={product}
                priceField={priceField}
                priceMin={priceMin}
                editing={editing}
                onRemove={onRemove}
              />
            );
          })}
          {!items.length && (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center' }}>
                Chưa có hàng hóa. Dùng ô tìm kiếm để thêm nhanh.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceItemsTable;
```

Update imports in `components/InvoiceEditor.jsx` (`./invoice/itemsTable/InvoiceItemsTable.jsx`) and `features/purchases/screen/PurchasesScreen.jsx` (`../../../components/invoice/itemsTable/InvoiceItemsTable.jsx`); delete the old file.

- [ ] **Step 4: Run** tests + `npm run build` → pass. **Step 5: Commit** `refactor(invoice): split items table and follow edition dimensions`.

---

### Task 6: Split the product modal

**Files:** Create `components/invoice/productModal/*`; Delete `components/invoice/InvoiceProductModal.jsx`; Modify importers (`InvoiceEditor.jsx`, `PurchasesScreen.jsx`).

- [ ] **Step 1: Implement hooks** (behaviour copied from the current component, lines noted):

`useDebouncedProductSearch.js` (old 38, 106-113):
```js
import { useEffect, useState } from 'react';

const SEARCH_DELAY_MS = 250;

export const useDebouncedProductSearch = ({ open, onSearchProducts }) => {
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    if (!open || !onSearchProducts) return;
    const keyword = searchKeyword.trim();
    const timer = setTimeout(() => onSearchProducts(keyword), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [open, searchKeyword, onSearchProducts]);

  return { searchKeyword, setSearchKeyword };
};
```

`useProductModalFocus.js` (old 42-45, 48-65, 73-93):
```js
import { useCallback, useEffect, useRef } from 'react';

const focusLater = (ref, { selectAll }) =>
  requestAnimationFrame(() => {
    if (!ref.current) return;
    if (!selectAll) {
      ref.current.focus();
      return;
    }
    ref.current.focus({ cursor: 'all' });
    ref.current.select?.();
  });

// Focus rules: search box on open, quantity box when the user picks another product.
export const useProductModalFocus = ({ open, autoFocusSearchOnOpen, pendingProductId }) => {
  const searchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const lastProductIdRef = useRef(null);
  const isFirstOpenCycleRef = useRef(true);

  const focusSearchInput = useCallback(
    ({ selectAll = false } = {}) => focusLater(searchInputRef, { selectAll }),
    []
  );

  useEffect(() => {
    if (open && autoFocusSearchOnOpen) focusSearchInput();
  }, [open, focusSearchInput, autoFocusSearchOnOpen]);

  useEffect(() => {
    if (!open) {
      isFirstOpenCycleRef.current = true;
      return;
    }
    const nextId = pendingProductId || null;
    if (nextId && nextId !== lastProductIdRef.current && !isFirstOpenCycleRef.current) {
      focusLater(qtyInputRef, { selectAll: true });
    }
    isFirstOpenCycleRef.current = false;
    lastProductIdRef.current = nextId;
  }, [open, pendingProductId]);

  return { searchInputRef, qtyInputRef, focusSearchInput };
};
```

`useAddShortcut.js` (old 95-104):
```js
import { useEffect } from 'react';

// F1 adds the pending product while the modal is active.
export const useAddShortcut = ({ enabled, onAdd }) => {
  useEffect(() => {
    if (!enabled) return;
    const handleKeyDown = (event) => {
      if (event.key !== 'F1') return;
      event.preventDefault();
      onAdd();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onAdd]);
};
```

`useQuickCreateProduct.js` (old 39-41, 46, 119-175):
```js
import { Form, message } from 'antd';
import { useState } from 'react';
import { buildCodeFromName } from '../../../pages/Catalog/catalogUtils.js';

// "Thêm mặt hàng" inside the product modal: form state, code autofill and save.
export const useQuickCreateProduct = ({ onCreateProduct, onCreated }) => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeEdited, setCodeEdited] = useState(false);
  const canCreate = typeof onCreateProduct === 'function';

  const openForm = () => {
    if (!canCreate) return;
    form.resetFields();
    setCodeEdited(false);
    setOpen(true);
  };

  const closeForm = () => {
    if (!loading) setOpen(false);
  };

  const handleNameChange = (event) => {
    if (!codeEdited) {
      form.setFieldsValue({ code: buildCodeFromName(event.target.value || '') });
    }
  };

  const handleCodeChange = (event) => {
    setCodeEdited((event.target.value || '').trim().length > 0);
  };

  const save = async () => {
    if (!canCreate) return;
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    setLoading(true);
    try {
      const created = await onCreateProduct(values);
      if (!created?.id) throw new Error('Không thể tạo sản phẩm.');
      setOpen(false);
      form.resetFields();
      setCodeEdited(false);
      onCreated(created);
      message.success('Đã tạo sản phẩm.');
    } catch (error) {
      message.error(`Không thể tạo sản phẩm: ${error.message || 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  return { form, open, loading, canCreate, openForm, closeForm, handleNameChange, handleCodeChange, save };
};
```

- [ ] **Step 2: Implement `ProductInfoPanel.jsx`** (old 221-301, right column) — props: `pendingProduct, pendingQty, pendingPrice, pendingLength, pendingWidth, previousPrice, priceMin, showDimensions, qtyInputRef, onChangeQty, onChangePrice, onChangeLength, onChangeWidth, onApplyPreviousPrice, onAdd, onClose`. Body is the old JSX verbatim, with `hasPreviousPrice`/`isSamePrice` computed at the top and the stock line using `pendingProduct?.stock ?? pendingProduct?.openingStock ?? 0`.

- [ ] **Step 3: Implement `InvoiceProductModal.jsx`** composition:
```jsx
import { Button, Modal } from 'antd';
import { useCallback } from 'react';
import { useEditionFeature } from '../../../editions/useEdition.js';
import CatalogFormModal from '../../../pages/Catalog/CatalogFormModal.jsx';
import ProductPicker from '../../ProductPicker.jsx';
import ProductInfoPanel from './ProductInfoPanel.jsx';
import { useAddShortcut } from './useAddShortcut.js';
import { useDebouncedProductSearch } from './useDebouncedProductSearch.js';
import { useProductModalFocus } from './useProductModalFocus.js';
import { useQuickCreateProduct } from './useQuickCreateProduct.js';

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 };

const InvoiceProductModal = ({
  open, onClose, products, pendingProduct, pendingQty, pendingPrice, pendingLength, pendingWidth,
  previousPrice, onSearchProducts, onChangeProduct, onChangeQty, onChangePrice, onChangeLength,
  onChangeWidth, onApplyPreviousPrice, onConfirmAdd, onCreateProduct, onProductCreated,
  autoFocusSearchOnOpen = true, showDimensions, priceMin = 0,
}) => {
  const editionDimensions = useEditionFeature('dimensions');
  const { searchKeyword, setSearchKeyword } = useDebouncedProductSearch({ open, onSearchProducts });
  const { searchInputRef, qtyInputRef, focusSearchInput } = useProductModalFocus({
    open, autoFocusSearchOnOpen, pendingProductId: pendingProduct?.id,
  });
  const quickCreate = useQuickCreateProduct({
    onCreateProduct,
    onCreated: (created) => {
      setSearchKeyword('');
      onSearchProducts?.('');
      if (onProductCreated) onProductCreated(created);
      else onChangeProduct?.(created.id);
      focusSearchInput({ selectAll: true });
    },
  });

  const handleAdd = useCallback(() => {
    if (onConfirmAdd({ closeAfter: false })) focusSearchInput({ selectAll: true });
  }, [onConfirmAdd, focusSearchInput]);
  useAddShortcut({ enabled: open && !quickCreate.open, onAdd: handleAdd });

  return (
    <Modal
      title="Nhập hàng hóa"
      open={open}
      onCancel={onClose}
      afterOpenChange={(nextOpen) => nextOpen && autoFocusSearchOnOpen && focusSearchInput()}
      footer={null}
      width={1100}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 3 }}>
          <div style={headerStyle}>
            <div className="section-title" style={{ margin: 0 }}>Danh sách hàng hóa</div>
            <Button onClick={quickCreate.openForm} disabled={!quickCreate.canCreate}>Thêm mặt hàng</Button>
          </div>
          <ProductPicker
            products={products}
            value={pendingProduct?.id || null}
            onChange={onChangeProduct}
            keyword={searchKeyword}
            onKeywordChange={setSearchKeyword}
            inputRef={searchInputRef}
            showStock
            showDetails={false}
          />
        </div>
        <ProductInfoPanel
          pendingProduct={pendingProduct}
          pendingQty={pendingQty}
          pendingPrice={pendingPrice}
          pendingLength={pendingLength}
          pendingWidth={pendingWidth}
          previousPrice={previousPrice}
          priceMin={priceMin}
          showDimensions={showDimensions ?? editionDimensions}
          qtyInputRef={qtyInputRef}
          onChangeQty={onChangeQty}
          onChangePrice={onChangePrice}
          onChangeLength={onChangeLength}
          onChangeWidth={onChangeWidth}
          onApplyPreviousPrice={onApplyPreviousPrice}
          onAdd={handleAdd}
          onClose={onClose}
        />
      </div>
      <CatalogFormModal
        open={quickCreate.open}
        editing={null}
        activeKey="products"
        form={quickCreate.form}
        onCancel={quickCreate.closeForm}
        onSave={quickCreate.save}
        onNameChange={quickCreate.handleNameChange}
        onCodeChange={quickCreate.handleCodeChange}
        confirmLoading={quickCreate.loading}
      />
    </Modal>
  );
};

export default InvoiceProductModal;
```
Update importers to `.../invoice/productModal/InvoiceProductModal.jsx`; delete the old file.

- [ ] **Step 4: Run** lint + tests + build. **Step 5: Commit** `refactor(invoice): split product modal into hooks and panels`.

---

### Task 7: Measure columns in detail and report modals

**Files:** Create `components/measure/MeasureCells.jsx`; Modify `pages/Purchases/PurchaseDetailModal.jsx`, `pages/Reports/ReportSalesInvoiceModal.jsx`, `pages/Reports/ReportPurchaseInvoiceModal.jsx`; Delete `pages/Reports/reportItemMeasure.js`.

- [ ] **Step 1: Implement `MeasureCells.jsx`**
```jsx
import { useEditionFeature } from '../../editions/useEdition.js';
import { getMeasuredQty } from '../../utils/lineMeasure.js';
import { formatDimension, formatMeasure } from '../../utils/measureFormat.js';

// Read-only table cells for editions that sell by length × width. Render nothing otherwise.
export const useMeasureColumnCount = ({ measuredQty = false } = {}) =>
  useEditionFeature('dimensions') ? 2 + (measuredQty ? 1 : 0) : 0;

export const DimensionHeaders = () =>
  useEditionFeature('dimensions') ? (
    <>
      <th>Dài</th>
      <th>Rộng</th>
    </>
  ) : null;

export const DimensionCells = ({ item }) =>
  useEditionFeature('dimensions') ? (
    <>
      <td>{formatDimension(item.length)}</td>
      <td>{formatDimension(item.width)}</td>
    </>
  ) : null;

export const MeasuredQtyHeader = ({ label = 'SL/m2' }) =>
  useEditionFeature('dimensions') ? <th>{label}</th> : null;

export const MeasuredQtyCell = ({ item }) =>
  useEditionFeature('dimensions') ? <td>{formatMeasure(getMeasuredQty(item))}</td> : null;
```

- [ ] **Step 2: Use it**
- `PurchaseDetailModal.jsx`: replace `<th>Dài</th><th>Rộng</th>` with `<DimensionHeaders />` and the two raw length/width `<td>` with `<DimensionCells item={item} />`.
- `ReportSalesInvoiceModal.jsx` / `ReportPurchaseInvoiceModal.jsx`: imports from `../../components/measure/MeasureCells.jsx` and `../../utils/measureFormat.js`; header `<DimensionHeaders />` + `<MeasuredQtyHeader />`; body `<DimensionCells item={item} />`, `<td>{formatMeasure(item.qty)}</td>`, `<MeasuredQtyCell item={item} />`. Empty-row `colSpan`: sales `const measureCount = useMeasureColumnCount({ measuredQty: true });` → `colSpan={(showSensitiveInfo ? 7 : 6) + measureCount}`; purchase `colSpan={6 + measureCount}`. Convert both components from implicit-return arrow to a block body to call the hook.
- Delete `reportItemMeasure.js`.

- [ ] **Step 3: Run** lint + tests + build. **Step 4: Commit** `feat(reports): hide dimension columns for editions without them`.

---

### Task 8: App shell — title, home modules, system, catalog fields

**Files:** Create `pages/homeTiles.js`, `pages/__tests__/homeTiles.test.js`; Modify `App.jsx`, `main.jsx`, `index.html`, `pages/Home.jsx`, `pages/System/System.jsx`, `pages/Catalog/CatalogFormModal.jsx`; Delete `constants/app.js`.

- [ ] **Step 1: Test**
```js
import { expect, it } from 'vitest';
import { getVisibleTiles, splitIntoColumns } from '../homeTiles.js';

it('keeps only tiles of enabled modules, in order', () => {
  const tiles = getVisibleTiles(['sales', 'system']);
  expect(tiles.map((tile) => tile.module)).toEqual(['system', 'sales']);
});

it('splits tiles into balanced columns', () => {
  const tiles = getVisibleTiles(['system', 'catalog', 'sales', 'purchases', 'cashbook', 'reports']);
  expect(splitIntoColumns(tiles, 2).map((column) => column.length)).toEqual([3, 3]);
});
```
- [ ] **Step 2: Implement `pages/homeTiles.js`**
```js
// Home screen tiles. `action` names a handler provided by Home.jsx; `to` is a route.
export const HOME_TILES = [
  { module: 'system', label: 'HỆ THỐNG', tone: 'linear-gradient(135deg, #0f6f75, #0d8f8a)', action: 'openSystem' },
  { module: 'catalog', label: 'DANH MỤC', tone: 'linear-gradient(135deg, #118d6c, #0dbf6a)', to: '/catalog' },
  { module: 'sales', label: 'BÁN HÀNG', tone: 'linear-gradient(135deg, #0f8f8a, #14b36a)', to: '/sales' },
  { module: 'purchases', label: 'NHẬP HÀNG', tone: 'linear-gradient(135deg, #12a36e, #0bc26b)', to: '/purchases' },
  { module: 'cashbook', label: 'THU CHI', tone: 'linear-gradient(135deg, #0f7f86, #0ea06d)', to: '/cashbook' },
  { module: 'reports', label: 'BÁO CÁO', tone: 'linear-gradient(135deg, #0c7c78, #0f9e8b)', action: 'openReports' },
];

export const getVisibleTiles = (modules) =>
  HOME_TILES.filter((tile) => modules.includes(tile.module));

export const splitIntoColumns = (tiles, columnCount) => {
  const size = Math.ceil(tiles.length / columnCount);
  return Array.from({ length: columnCount }, (_, index) =>
    tiles.slice(index * size, (index + 1) * size)
  ).filter((column) => column.length);
};
```
In `Home.jsx` replace the two hard-coded `home-button-column` blocks with:
```jsx
{tileColumns.map((column, columnIndex) => (
  <div className="home-button-column" key={columnIndex}>
    {column.map((tile) => (
      <BigTileButton
        key={tile.module}
        to={tile.to}
        label={tile.label}
        tone={tile.tone}
        onClick={tile.action ? tileActions[tile.action] : undefined}
      />
    ))}
  </div>
))}
```
with, in the component body,
```js
const { modules } = useEdition();
const tileColumns = splitIntoColumns(getVisibleTiles(modules), 2);
const tileActions = {
  openSystem: handleOpenSystemModal,
  openReports: () => setReportModalOpen(true),
};
```
(placed after `handleOpenSystemModal` is defined).

- [ ] **Step 3: Title** — `App.jsx`: remove the `title` prop and `DEFAULT_APP_TITLE` import; `const { appTitle } = useEdition();` and render `{appTitle}`. Delete `constants/app.js`. `index.html`: `<title>Phần mềm bán hàng</title>`. `main.jsx`: in the non-demo branch call `applyEditionToDocument();` before `renderApp();`.

- [ ] **Step 4: System page** — `const sampleDataEnabled = useEditionFeature('sampleData');` and wrap the "Dữ liệu mẫu" title + action row in `{sampleDataEnabled && (<>...</>)}`.

- [ ] **Step 5: Catalog form** — in `CatalogFormModal.jsx` read `const { labels } = useEdition();` (convert to block body) and add after the ĐVT row:
```jsx
<Row gutter={16}>
  <Col xs={24} md={12}>
    <Form.Item label={labels.group} name="group">
      <Input />
    </Form.Item>
  </Col>
  <Col xs={24} md={12}>
    <Form.Item label={labels.spec} name="spec">
      <Input />
    </Form.Item>
  </Col>
</Row>
```
(`useCatalogForm` already spreads all form values into the saved product.)

- [ ] **Step 6: Run** lint + tests + build. **Step 7: Commit** `feat(editions): edition-driven title, home modules, system and catalog fields`.

---

### Task 9: Demo uses the shared edition configs

**Files:** Modify `demo/editions/index.js`, `demo/editions/{minimart,vlxd,fashion,pharmacy}/index.js`, `demo/ui/EditionGrid.jsx`, `demo/ui/DemoGate.jsx`, `demo/seed/seedEdition.js`, `demo/session/demoSession.js`, demo tests; Create `demo/editions/nhomkinh/{index,products}.js`.

- [ ] **Step 1:** In each demo edition `index.js` remove `name`, `tagline`, `appTitle` (now in `src/editions`). Keep `id` and seed fields.
- [ ] **Step 2:** `demo/editions/index.js`:
```js
import { EDITION_IDS, getEditionConfig } from '../../editions/index.js';
import fashion from './fashion/index.js';
import minimart from './minimart/index.js';
import nhomkinh from './nhomkinh/index.js';
import pharmacy from './pharmacy/index.js';
import vlxd from './vlxd/index.js';

const SEED_DATA = { nhomkinh, vlxd, minimart, fashion, pharmacy };

// Display config (src/editions) + sample data (this folder), in picker order.
export const DEMO_EDITIONS = EDITION_IDS.map((id) => ({
  ...getEditionConfig(id),
  ...SEED_DATA[id],
}));

export const getDemoEdition = (editionId) =>
  DEMO_EDITIONS.find((edition) => edition.id === editionId) || null;
```
Rename usages: `EDITIONS` → `DEMO_EDITIONS`, `getEdition` → `getDemoEdition` in `EditionGrid.jsx`, `seedEdition.js`, `demoSession.js`, `__tests__/editions.test.js`, `__tests__/seedContract.test.js`.
- [ ] **Step 3:** `demoSession.js`: add `const activateRuntime = (edition) => { setEdition(edition.id); applyEditionToDocument(edition); };` (imports from `../../editions/editionRuntime.js`) and call it right before returning `status: 'ready'` in `bootDemoSession` and before returning in `activateEdition`.
- [ ] **Step 4:** `DemoGate.jsx`: drop `cloneElement`; render `{app}`.
- [ ] **Step 5:** Create `demo/editions/nhomkinh/products.js` (≥ 25 rows: Nhôm Xingfa/PMA profiles, kính cường lực/kính trắng in `m2`, sắt hộp, phụ kiện) and `index.js` (`id: 'nhomkinh'`, `seed: 5505`, `codePrefix: 'NK'`, shop, units `['cây','tấm','m2','kg','cái','bộ','hộp']`, 8 customers incl. `Khách lẻ` walk-in and 3 debtors, 3 suppliers, 3 expenses, `activity: { invoicesPerDay: [1, 3], maxQty: 8, purchaseQty: [10, 40], walkInRatio: 0.4 }`).
- [ ] **Step 6: Run** `npx vitest run src/demo` → editions test 5 editions, seed contract 20 tests pass. **Step 7: Commit** `feat(demo): share edition configs and add aluminium/glass demo`.

---

### Task 10: Remove dead purchase files

- [ ] Verify no references: `grep -rlE "PurchaseItemsTable|PurchaseSearchModal|PurchaseTopSection|PurchaseHeader|usePurchasesLogic|usePurchaseFilters" banhang/src` lists only the files themselves.
- [ ] `git rm` the six files; run lint + tests + build; commit `chore: remove unused purchase components`.

---

### Task 11: Docs, verification, browser smoke

- [ ] Create `banhang/src/editions/README.md`: purpose, config shape, how runtime is set (build vs demo), rules (read flags via hooks/runtime, formulas edition-agnostic, lazy defaults), recipes: add an edition, add a feature flag, build an edition (`VITE_EDITION=pharmacy npm run build:electron`).
- [ ] Update `banhang/src/demo/README.md` (editions = config + seed, add-edition recipe), `banhang/AGENT.md` (section 12 Editions), root `CLAUDE.md` (map + build commands + roadmap 2a done).
- [ ] Verify: `npm run lint` (0 errors), `VITE_API_URL= npx vitest run`, `npm run build`, `VITE_EDITION=pharmacy npm run build`, `VITE_EDITION=nope npm run build` (fails), `npm run build:demo` + grep no `bh-demo` in normal dist, backend `npx vitest run`.
- [ ] Browser smoke on demo build: pharmacy sales table has no "Dài" header and template preview has no "M2"; nhomkinh shows both; home shows 6 tiles; catalog form shows "Quy cách đóng gói" for pharmacy.
- [ ] Commit `docs: document edition framework`.
