# Barcode Scanning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scanning a product barcode adds it (qty 1, scanned unit, unit price) to the sale or purchase; scanning again adds 1; the unit of a line can be changed in the table or with F4.

**Architecture:** Barcodes live on `Product.barcode` and `units[].barcode`, unique across products (backend check). The existing product search also matches barcodes; the frontend picks the exact match. A capture-phase keyboard listener recognizes scanner input by keystroke timing. One shared hook (`useBarcodeLines`) turns codes into merged lines for both screens, gated by the edition flag `barcode`.

**Tech Stack:** Express + Mongoose (backend, vitest), React 18 + Ant Design 5 (frontend, vitest, no testing-library), browser demo reusing backend services.

Spec: `docs/superpowers/specs/2026-10-29-barcode-scanning-design.md`. Phase 1 (units) is done on this branch: see `banhang/src/utils/productUnits.js`, `banhang-backend/src/utils/productUnits.js`.

Commands:
- Backend: `cd banhang-backend && npx vitest run` (116 pass now), `npm run lint`
- Frontend: `cd banhang && VITE_API_URL= npx vitest run` (223 pass now), `npm run lint` (0 errors; ~445 old warnings), `npm run build`

Git safety for every task: never `git stash` / `checkout -- <file>` / `reset` / `restore` / `clean`; the repo has a user stash `stash@{0}`; never touch `.gitignore` or `.vite/`. Commit only your files. Every commit message ends with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Frontend files stay ≤ 200 lines (`banhang/AGENT.md`). No `// path` header comments in new files.

---

### Task 1: Backend — barcode fields, normalization, uniqueness

**Files:**
- Modify: `banhang-backend/src/models/Product.js` (`barcode` on product and on `ProductUnitSchema`)
- Modify: `banhang-backend/src/utils/productUnits.js` (`normalizeProductUnits` keeps `barcode`; empty-row check)
- Create: `banhang-backend/src/services/productBarcodes.service.js`
- Modify: `banhang-backend/src/services/crud.service.js` (create / bulk / update call it)
- Test: `banhang-backend/src/utils/__tests__/productUnits.test.js`, `banhang-backend/src/services/__tests__/productBarcodes.service.test.js` (new)

- [ ] **Step 1: Failing tests**

`productUnits.test.js` — add:

```js
describe('normalizeProductUnits barcodes', () => {
  it('trims unit barcodes and drops empty ones', () => {
    expect(
      normalizeProductUnits(
        [
          { name: 'thùng', factor: 24, barcode: ' 8934588012345 ' },
          { name: 'lốc', factor: 6, barcode: '' },
        ],
        'lon'
      ).units
    ).toEqual([
      { name: 'thùng', factor: 24, sellPrice: null, barcode: '8934588012345' },
      { name: 'lốc', factor: 6, sellPrice: null },
    ]);
  });

  it('rejects a unit row with only a barcode', () => {
    expect(normalizeProductUnits([{ barcode: '123456' }], 'lon').error).toBe(
      'Đơn vị quy đổi thiếu tên.'
    );
  });
});
```

`productBarcodes.service.test.js` (new):

```js
import { describe, expect, it, vi } from 'vitest';
import {
  assertBarcodesAvailable,
  collectBarcodes,
  normalizeProductBarcode,
} from '../productBarcodes.service.js';

const modelWith = (records) => ({
  find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(records) }),
});

describe('product barcodes', () => {
  it('normalizes the product barcode', () => {
    expect(normalizeProductBarcode({ barcode: ' 893 ' })).toEqual({ barcode: '893' });
    expect(normalizeProductBarcode({ barcode: '' })).toEqual({});
    expect(normalizeProductBarcode({ name: 'x' })).toEqual({ name: 'x' });
  });

  it('collects product and unit barcodes', () => {
    expect(
      collectBarcodes({ barcode: 'A1', units: [{ barcode: 'B2' }, { name: 'lốc' }] })
    ).toEqual(['A1', 'B2']);
  });

  it('rejects duplicates inside one product', async () => {
    await expect(
      assertBarcodesAvailable(modelWith([]), [
        { id: 'p1', barcode: 'A1', units: [{ name: 'thùng', barcode: 'A1' }] },
      ])
    ).rejects.toMatchObject({
      message: 'Mã vạch A1 bị trùng trong cùng hàng.',
      status: 400,
    });
  });

  it('rejects duplicates inside a bulk payload', async () => {
    await expect(
      assertBarcodesAvailable(modelWith([]), [
        { id: 'p1', name: 'Coca', barcode: 'A1' },
        { id: 'p2', name: 'Pepsi', units: [{ name: 'thùng', barcode: 'A1' }] },
      ])
    ).rejects.toThrow('Mã vạch A1 đã dùng cho hàng Coca.');
  });

  it('rejects barcodes used by another product', async () => {
    const Model = modelWith([
      { id: 'p9', name: 'Bia', barcode: 'X', units: [{ name: 'thùng', barcode: 'A1' }] },
    ]);
    await expect(
      assertBarcodesAvailable(Model, [{ id: 'p1', barcode: 'A1' }])
    ).rejects.toThrow('Mã vạch A1 đã dùng cho hàng Bia.');
    expect(Model.find).toHaveBeenCalledWith({
      isDeleted: { $ne: true },
      $or: [{ barcode: { $in: ['A1'] } }, { 'units.barcode': { $in: ['A1'] } }],
    });
  });

  it('ignores the product being updated and skips the query without codes', async () => {
    const Model = modelWith([{ id: 'p1', name: 'Coca', barcode: 'A1' }]);
    await expect(
      assertBarcodesAvailable(Model, [{ id: 'p1', barcode: 'A1' }])
    ).resolves.toBeUndefined();
    const Empty = modelWith([]);
    await assertBarcodesAvailable(Empty, [{ id: 'p1' }]);
    expect(Empty.find).not.toHaveBeenCalled();
  });
});
```

Run: `cd banhang-backend && npx vitest run src/utils src/services` → FAIL.

- [ ] **Step 2: Implement**

`Product.js`: add `barcode: String,` to `ProductUnitSchema` and `barcode: String,` after `code: String,` in `ProductSchema`.

`productUnits.js`:
- `isEmptyUnitRow` also requires `isBlank(unit?.barcode)`.
- in `normalizeProductUnits` map, add the barcode only when present:

```js
    .map((unit) => {
      const barcode = String(unit.barcode ?? '').trim();
      return {
        name: String(unit.name ?? '').trim(),
        factor: Number(unit.factor),
        sellPrice: toPrice(unit.sellPrice),
        ...(barcode ? { barcode } : {}),
      };
    });
```

`services/productBarcodes.service.js`:

```js
import { unitError } from '../utils/productUnits.js';

// Barcodes of products and their packaging units are unique across active products.
export const normalizeProductBarcode = (payload) => {
  if (payload.barcode === undefined) return payload;
  const { barcode, ...rest } = payload;
  const code = String(barcode ?? '').trim();
  return code ? { ...rest, barcode: code } : rest;
};

export const collectBarcodes = (product = {}) =>
  [product.barcode, ...(product.units || []).map((unit) => unit?.barcode)]
    .map((code) => String(code ?? '').trim())
    .filter(Boolean);

const assertNoDuplicates = (payloads) => {
  const owners = new Map();
  payloads.forEach((product) => {
    const codes = collectBarcodes(product);
    codes.forEach((code, index) => {
      if (codes.indexOf(code) !== index) {
        throw unitError(`Mã vạch ${code} bị trùng trong cùng hàng.`);
      }
      const owner = owners.get(code);
      if (owner) throw unitError(`Mã vạch ${code} đã dùng cho hàng ${owner.name || ''}.`);
      owners.set(code, product);
    });
  });
};

// Throws a 400 error when a barcode is repeated or used by another active product.
export const assertBarcodesAvailable = async (Model, payloads = []) => {
  assertNoDuplicates(payloads);
  const codes = payloads.flatMap(collectBarcodes);
  if (!codes.length) return;
  const ids = new Set(payloads.map((product) => product.id).filter(Boolean));
  const others = await Model.find({
    isDeleted: { $ne: true },
    $or: [{ barcode: { $in: codes } }, { 'units.barcode': { $in: codes } }],
  }).lean();
  const wanted = new Set(codes);
  others
    .filter((product) => !ids.has(product.id))
    .forEach((product) => {
      const code = collectBarcodes(product).find((value) => wanted.has(value));
      if (code) throw unitError(`Mã vạch ${code} đã dùng cho hàng ${product.name || ''}.`);
    });
};
```

`crud.service.js` (import the three functions):
- `createItem` Product branch, after `applyProductUnits`: `cleanPayload = normalizeProductBarcode(cleanPayload);` then `await assertBarcodesAvailable(Model, [cleanPayload]);` (ensure `cleanPayload.id` is set before the check: move `if (!cleanPayload.id) cleanPayload.id = uuid();` above the Product branch).
- `bulkCreateItems` Product branch, after `applyProductUnits`: `payload = payload.map(normalizeProductBarcode); await assertBarcodesAvailable(Model, payload);` (ids are already assigned there).
- `updateItem` Product branch, after `applyProductUnits`: trim the barcode but keep the key so a cleared barcode overwrites the old one via `$set` — `if (cleanPayload.barcode !== undefined) cleanPayload.barcode = String(cleanPayload.barcode ?? '').trim();` (do not use `normalizeProductBarcode` here). Then, when `cleanPayload.barcode !== undefined || cleanPayload.units !== undefined`:

```js
      await assertBarcodesAvailable(Model, [
        {
          id,
          name: cleanPayload.name ?? existing.name,
          barcode: cleanPayload.barcode ?? existing.barcode,
          units: cleanPayload.units ?? existing.units,
        },
      ]);
```

`collectBarcodes` ignores empty strings, so a cleared barcode (`''`) never conflicts.

Existing `crud.service.test.js` mocks: `createProductModel.find` returns `duplicateProducts` for every `find`; make sure existing tests still pass (barcode check only queries when codes exist).

- [ ] **Step 3: Run** `cd banhang-backend && npx vitest run && npm run lint` → PASS.

- [ ] **Step 4: Commit** `feat(barcode): product and unit barcodes, unique across products`

---

### Task 2: Backend — search by barcode (+ demo dotted path)

**Files:**
- Modify: `banhang-backend/src/modules/sales/services/sales.service.js` (`buildProductSearchFilter`)
- Test: `banhang-backend/src/modules/sales/services/__tests__/productSearch.test.js` (new) and a demo test in `banhang/src/demo/__tests__/demoModel.test.js` (or the closest existing demo model test file)

- [ ] **Step 1: Failing tests**

Export `buildProductSearchFilter` from `sales.service.js` (named export) and test:

```js
import { describe, expect, it } from 'vitest';
import { buildProductSearchFilter } from '../sales.service.js';

describe('buildProductSearchFilter', () => {
  it('matches product and unit barcodes', () => {
    const filter = buildProductSearchFilter('8934588012345');
    const fields = filter.$and[0].$or.map((clause) => Object.keys(clause)[0]);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'code', 'barcode', 'units.barcode'])
    );
  });
});
```

(The module imports repositories/models; if importing it in a test pulls mongoose in a way that fails, mock `../../repositories/sales.repository.js` with `vi.mock` like other service tests do.)

Demo test (read the existing demo model tests first and follow their setup): create two products in the demo `Product` model — one with `barcode: 'A1'`, one with `units: [{ name: 'thùng', factor: 24, barcode: 'B2' }]` — and assert:
- `Product.find({ 'units.barcode': { $in: ['B2'] } }).lean()` returns the second product;
- `Product.find({ $or: [{ barcode: /B2/i }, { 'units.barcode': /B2/i }] }).lean()` returns the second product.

- [ ] **Step 2: Implement** — add `{ barcode: regex }, { 'units.barcode': regex }` to `buildOr`. If the demo test fails, extend the demo query matcher (`banhang/src/demo/db/queryTools.js` or wherever filters are evaluated) to support dotted paths into arrays of sub-documents, following `banhang/src/demo/README.md`.

- [ ] **Step 3: Run** backend tests + `cd banhang && VITE_API_URL= npx vitest run src/demo` → PASS.

- [ ] **Step 4: Commit** `feat(barcode): product search matches barcodes`

---

### Task 3: Frontend — flag, pure line helpers, line builders

**Files:**
- Modify: every `banhang/src/editions/*/index.js` (`features.barcode`: minimart `true`, others `false`), `banhang/src/platform/__tests__/editions.test.js`, `banhang/src/editions/README.md`, `banhang/src/platform/README.md` (features shape line)
- Create: `banhang/src/utils/barcodeLines.js`, test `banhang/src/utils/__tests__/barcodeLines.test.js`
- Modify: `banhang/src/components/invoice/invoiceItemHandlers.js` (export `buildSaleLine`, used by `createConfirmAddHandler`)
- Modify: `banhang/src/features/purchases/domain/purchasesDomain.js` (export `buildPurchaseLine`), `banhang/src/pages/Purchases/usePurchaseProductModal.js` (use it)
- Tests: `components/invoice/__tests__/invoiceItemHandlers.test.js`, `features/purchases/domain/__tests__/purchasesDomain.test.js`

- [ ] **Step 1: Flag** — shape test adds `barcode: expect.any(Boolean)`; add the key to all editions; README rows (`features.barcode` read in `features/barcode/useBarcodeLines.js` callers, `pages/Catalog/*`). Run `src/platform` tests.

- [ ] **Step 2: Failing tests for helpers**

```js
import { describe, expect, it } from 'vitest';
import {
  findBarcodeMatch,
  mergeScannedLine,
  nextUnitName,
  switchLineUnit,
} from '../barcodeLines.js';

const coca = {
  id: 'p1',
  code: 'COCA',
  unit: 'lon',
  barcode: '111',
  units: [
    { name: 'lốc', factor: 6, barcode: '222' },
    { name: 'thùng', factor: 24, barcode: '333' },
  ],
};
const pepsi = { id: 'p2', code: '333', unit: 'lon' };

describe('findBarcodeMatch', () => {
  it('prefers barcodes, then product code', () => {
    expect(findBarcodeMatch([pepsi, coca], ' 333 ')).toEqual({ product: coca, unitName: 'thùng' });
    expect(findBarcodeMatch([coca], '111')).toEqual({ product: coca, unitName: '' });
    expect(findBarcodeMatch([coca], 'COCA')).toEqual({ product: coca, unitName: '' });
    expect(findBarcodeMatch([coca], '999')).toBeNull();
    expect(findBarcodeMatch([coca], '')).toBeNull();
  });
});

describe('mergeScannedLine', () => {
  const line = { productId: 'p1', qty: 1, unitPrice: 10000, lineTotal: 10000 };
  it('adds 1 to the same product and unit', () => {
    const items = mergeScannedLine([line], { ...line }, 'unitPrice');
    expect(items).toEqual([{ ...line, qty: 2, lineTotal: 20000 }]);
  });
  it('appends a line for another unit or a line with dimensions', () => {
    const carton = { ...line, unitName: 'thùng', factor: 24, unitPrice: 220000, lineTotal: 220000 };
    expect(mergeScannedLine([line], carton, 'unitPrice')).toHaveLength(2);
    const measured = { ...line, length: 2, width: 1 };
    expect(mergeScannedLine([measured], { ...line }, 'unitPrice')).toHaveLength(2);
  });
  it('works with unitCost', () => {
    const buy = { productId: 'p1', qty: 1, unitCost: 7000, lineTotal: 7000 };
    expect(mergeScannedLine([buy], { ...buy }, 'unitCost')[0]).toMatchObject({ qty: 2, lineTotal: 14000 });
  });
});

describe('switchLineUnit / nextUnitName', () => {
  it('changes unit fields and price, keeps qty', () => {
    const item = { productId: 'p1', qty: 2, unitPrice: 10000, lineTotal: 20000 };
    expect(switchLineUnit(item, coca, 'thùng', 220000, 'unitPrice')).toEqual({
      productId: 'p1', qty: 2, unitPrice: 220000, lineTotal: 440000, unitName: 'thùng', factor: 24,
    });
    const back = switchLineUnit({ ...item, unitName: 'thùng', factor: 24 }, coca, '', 10000, 'unitPrice');
    expect(back).not.toHaveProperty('unitName');
    expect(back).not.toHaveProperty('factor');
  });
  it('cycles units', () => {
    expect(nextUnitName(coca, '')).toBe('lốc');
    expect(nextUnitName(coca, 'lốc')).toBe('thùng');
    expect(nextUnitName(coca, 'thùng')).toBe('');
    expect(nextUnitName({ unit: 'cái' }, '')).toBe('');
  });
});
```

- [ ] **Step 3: Implement `utils/barcodeLines.js`**

```js
import { getLineAmount } from './lineMeasure.js';
import { buildLineUnitFields, findProductUnit, getUnitOptions } from './productUnits.js';

const clean = (value) => String(value ?? '').trim();

// Exact match of a scanned/typed code: product or unit barcode first, then product code.
export const findBarcodeMatch = (products = [], rawCode) => {
  const code = clean(rawCode);
  if (!code) return null;
  for (const product of products) {
    if (clean(product?.barcode) === code) return { product, unitName: '' };
    const unit = (product?.units || []).find((entry) => clean(entry?.barcode) === code);
    if (unit) return { product, unitName: unit.name };
  }
  const byCode = products.find((product) => clean(product?.code) === code);
  return byCode ? { product: byCode, unitName: '' } : null;
};

const hasDimensions = (item) => Boolean(item?.length) || Boolean(item?.width);
const sameLine = (a, b) =>
  a.productId === b.productId &&
  (a.unitName || '') === (b.unitName || '') &&
  !hasDimensions(a) &&
  !hasDimensions(b);

const withTotal = (item, priceField) => ({
  ...item,
  lineTotal: getLineAmount(item, priceField),
});

// Scanning the same product+unit again adds its qty to the existing line.
export const mergeScannedLine = (items = [], line, priceField) => {
  const index = items.findIndex((item) => sameLine(item, line));
  if (index < 0) return [...items, withTotal(line, priceField)];
  return items.map((item, position) =>
    position === index
      ? withTotal({ ...item, qty: Number(item.qty || 0) + Number(line.qty || 0) }, priceField)
      : item
  );
};

export const switchLineUnit = (item, product, unitName, price, priceField) => {
  const { unitName: _oldName, factor: _oldFactor, ...rest } = item;
  const unit = findProductUnit(product, unitName);
  const selection = { value: unit ? unit.name : '', factor: unit ? Number(unit.factor) : 1 };
  return withTotal(
    { ...rest, [priceField]: Number(price || 0), ...buildLineUnitFields(selection) },
    priceField
  );
};

export const nextUnitName = (product, unitName = '') => {
  const values = getUnitOptions(product).map((option) => option.value);
  const index = values.indexOf(unitName || '');
  return values[(index + 1) % values.length] || '';
};
```

Check `getLineAmount(item, priceField)` signature in `utils/lineMeasure.js` (purchases call `getLineAmount(item, 'unitCost')`) and `buildLineUnitFields` in `utils/productUnits.js`; adapt names if they differ. Key order in `toEqual` does not matter.

- [ ] **Step 4: Line builders** — move the sale line object of `createConfirmAddHandler` into an exported pure function and reuse it; same for purchases:

```js
// invoiceItemHandlers.js
export const buildSaleLine = ({ product, qty, unitPrice, dimensions = {}, unit }) => ({
  productId: product.id,
  qty,
  unitPrice,
  lineTotal: getLineAmount({ qty, unitPrice, ...dimensions }),
  costPriceSnapshot: Number(product.avgCost || 0),
  excludeFromProfitSnapshot: Boolean(product.excludeFromProfit),
  lineNote: '',
  length: dimensions.length ?? null,
  width: dimensions.width ?? null,
  ...buildLineUnitFields(unit),
});
```

```js
// purchasesDomain.js
export const buildPurchaseLine = ({ product, qty, unitCost, dimensions = {}, unit }) => ({
  productId: product.id,
  qty,
  unitCost,
  lineTotal: getPurchaseLineTotal({ qty, unitCost, ...dimensions }),
  lineNote: '',
  length: dimensions.length ?? null,
  width: dimensions.width ?? null,
  ...buildLineUnitFields(unit),
});
```

Keep the exact existing line shape (compare with the current object literals: `length`/`width` values today come from `readDimensions`; keep them identical). Add one test each (`buildSaleLine` with a carton unit; `buildPurchaseLine` base unit has no unit fields). Existing tests must pass unchanged.

- [ ] **Step 5: Run** `cd banhang && VITE_API_URL= npx vitest run && npm run lint` → PASS. **Commit** `feat(barcode): flag, line helpers and shared line builders`

---

### Task 4: Frontend — scan buffer, scanner hook, beep

**Files:**
- Create: `banhang/src/utils/scanBuffer.js` + `banhang/src/utils/__tests__/scanBuffer.test.js`
- Create: `banhang/src/features/barcode/useBarcodeScanner.js`
- Create: `banhang/src/utils/beep.js`

- [ ] **Step 1: Failing test**

```js
import { describe, expect, it } from 'vitest';
import { createScanBuffer } from '../scanBuffer.js';

const type = (buffer, text, start, gap) =>
  [...text].map((char, index) => buffer.push(char, start + index * gap));

describe('createScanBuffer', () => {
  it('recognizes fast keystrokes ended by Enter as a scan', () => {
    const buffer = createScanBuffer();
    expect(type(buffer, '8934588012345', 0, 10)).toEqual([
      'first', ...Array(12).fill('scanning'),
    ]);
    expect(buffer.end(130)).toBe('8934588012345');
    expect(buffer.end(140)).toBeNull();
  });

  it('ignores slow typing and short codes', () => {
    const buffer = createScanBuffer();
    expect(type(buffer, 'abc123', 0, 150)).toEqual(Array(6).fill('first'));
    expect(buffer.end(900)).toBeNull();
    type(buffer, '12', 1000, 5);
    expect(buffer.end(1010)).toBeNull();
  });

  it('ignores an Enter that comes long after the last key', () => {
    const buffer = createScanBuffer();
    type(buffer, '893458', 0, 10);
    expect(buffer.end(1000)).toBeNull();
  });
});
```

- [ ] **Step 2: Implement**

```js
// Scanner (keyboard wedge) input = keystrokes much faster than typing, ended by Enter.
export const SCAN_MAX_GAP_MS = 40;
export const SCAN_MIN_LENGTH = 4;

export const createScanBuffer = ({ maxGap = SCAN_MAX_GAP_MS, minLength = SCAN_MIN_LENGTH } = {}) => {
  let chars = [];
  let lastAt = -Infinity;
  return {
    // 'first' = may be typing (let it through); 'scanning' = part of a scan (swallow it).
    push(char, at) {
      if (at - lastAt > maxGap) chars = [];
      chars.push(char);
      lastAt = at;
      return chars.length > 1 ? 'scanning' : 'first';
    },
    // On Enter: the scanned code, or null when this was not a scan.
    end(at) {
      const code = chars.join('');
      const isScan = chars.length >= minLength && at - lastAt <= maxGap * 2;
      chars = [];
      lastAt = -Infinity;
      return isScan ? code : null;
    },
  };
};
```

- [ ] **Step 3: Hook** (`features/barcode/useBarcodeScanner.js`, no unit test — DOM glue):

```js
import { useEffect, useRef } from 'react';
import { createScanBuffer } from '../../utils/scanBuffer.js';

const isModalOpen = () =>
  Array.from(document.querySelectorAll('.ant-modal-wrap')).some(
    (node) => node.style.display !== 'none'
  );

const isField = (node) =>
  node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement;

// Puts back a field's value (React-controlled inputs need the native setter + input event).
const restoreValue = (snapshot) => {
  if (!snapshot || !isField(snapshot.node)) return;
  const proto = Object.getPrototypeOf(snapshot.node);
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(snapshot.node, snapshot.value);
  snapshot.node.dispatchEvent(new Event('input', { bubbles: true }));
};

// Calls onScan(code) for barcode-scanner input anywhere on the page (no modal open).
export const useBarcodeScanner = ({ enabled, onScan }) => {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return undefined;
    const buffer = createScanBuffer();
    let snapshot = null;
    let leaked = false;

    const handleKeyDown = (event) => {
      if (event.ctrlKey || event.altKey || event.metaKey || isModalOpen()) return;
      if (event.key === 'Enter') {
        const code = buffer.end(event.timeStamp);
        if (!code) return;
        event.preventDefault();
        event.stopPropagation();
        if (leaked) restoreValue(snapshot);
        snapshot = null;
        leaked = false;
        onScanRef.current?.(code);
        return;
      }
      if (event.key.length !== 1) return;
      const state = buffer.push(event.key, event.timeStamp);
      if (state === 'first') {
        const node = document.activeElement;
        snapshot = isField(node) ? { node, value: node.value } : null;
        leaked = Boolean(snapshot);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [enabled]);
};
```

Note on `restoreValue`: the snapshot is taken on keydown of the first char, i.e. before the browser inserts it, so restoring removes the leaked first character.

- [ ] **Step 4: Beep** (`utils/beep.js`):

```js
let context = null;

// Short scanner feedback tone; silent when Web Audio is unavailable or blocked.
export const playBeep = (kind = 'ok') => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    context = context || new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = kind === 'ok' ? 1200 : 300;
    gain.gain.value = 0.1;
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + (kind === 'ok' ? 0.08 : 0.3));
  } catch {
    // no sound
  }
};
```

- [ ] **Step 5: Run** tests + lint. **Commit** `feat(barcode): scanner input detection and beep`

---

### Task 5: Frontend — shared `useBarcodeLines` + sales wiring

**Files:**
- Create: `banhang/src/features/barcode/useBarcodeLines.js`
- Modify: `banhang/src/features/sales/hooks/useSalesCatalog.js` (`searchProducts` returns the fetched list)
- Modify: sales editor stack: `components/invoice/hooks/useInvoiceProductSelection.js` (or a new small hook it calls), `components/invoice/hooks/useInvoiceQuickAdd.js`, `components/invoice/invoiceViewProps.js`, `components/invoice/useInvoiceEditorState.js`
- Modify: `components/invoice/itemsTable/InvoiceItemsTable.jsx`, `components/invoice/itemsTable/InvoiceItemRow.jsx` (unit select cell); create `components/invoice/itemsTable/UnitCell.jsx`

- [ ] **Step 1: Shared hook**

```js
import { useCallback, useEffect, useRef } from 'react';
import { message } from 'antd';
import { findBarcodeMatch, mergeScannedLine, nextUnitName, switchLineUnit } from '../../utils/barcodeLines.js';
import { findProductUnit } from '../../utils/productUnits.js';
import { playBeep } from '../../utils/beep.js';
import { useBarcodeScanner } from './useBarcodeScanner.js';

// Scanned/typed barcodes → merged lines; unit switching on lines (table select, F4).
export const useBarcodeLines = ({
  enabled,
  items,
  setItems,
  products,
  searchProducts,
  priceField,
  getUnitPrice,
  buildLine,
}) => {
  const latest = useRef({});
  latest.current = { items, products, getUnitPrice, buildLine };

  const addByCode = useCallback(
    async (code) => {
      const found = (await searchProducts?.(code)) || [];
      const match = findBarcodeMatch([...found, ...latest.current.products], code);
      if (!match) return false;
      const { product, unitName } = match;
      const unit = findProductUnit(product, unitName);
      const line = latest.current.buildLine({
        product,
        qty: 1,
        price: latest.current.getUnitPrice(product, unitName),
        unit: { value: unit ? unit.name : '', factor: unit ? Number(unit.factor) : 1 },
      });
      setItems((prev) => mergeScannedLine(prev, line, priceField));
      return true;
    },
    [priceField, searchProducts, setItems]
  );

  const handleScan = useCallback(
    async (code) => {
      try {
        if (await addByCode(code)) {
          playBeep('ok');
          return;
        }
        playBeep('error');
        message.warning(`Mã ${code} chưa có trong danh mục.`);
      } catch (error) {
        playBeep('error');
        message.error(error.message || 'Không tìm được hàng theo mã vạch.');
      }
    },
    [addByCode]
  );

  useBarcodeScanner({ enabled, onScan: handleScan });

  const changeItemUnit = useCallback(
    (index, unitName) => {
      const { items: current, products: list, getUnitPrice: priceOf } = latest.current;
      const item = current[index];
      const product = list.find((entry) => entry.id === item?.productId);
      if (!product) return;
      const price = priceOf(product, unitName);
      setItems((prev) =>
        prev.map((line, position) =>
          position === index ? switchLineUnit(line, product, unitName, price, priceField) : line
        )
      );
    },
    [priceField, setItems]
  );

  useEffect(() => {
    if (!enabled) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== 'F4') return;
      const { items: current, products: list } = latest.current;
      const index = current.length - 1;
      const product = list.find((entry) => entry.id === current[index]?.productId);
      if (!product?.units?.length) return;
      event.preventDefault();
      changeItemUnit(index, nextUnitName(product, current[index].unitName));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeItemUnit, enabled]);

  return { addByCode, changeItemUnit };
};
```

Check how each screen's `setItems` works: if a screen's `setItems` does not accept an updater function, adapt (`setItems(mergeScannedLine(latest.current.items, …))`). Sales `createConfirmAddHandler` already calls `setItems((prev) => …)`; purchases too.

- [ ] **Step 2: `searchProducts` returns data** — `useSalesCatalog.searchProducts`: `return Array.isArray(data) ? data : [];` after merging.

- [ ] **Step 3: Sales wiring**
- Where `items`, `setItems`, `products`/`activeProducts`, `onSearchProducts` and `getProductPrice` are available (inside `useInvoiceProductSelection.js`), call:

```js
  const barcodeEnabled = useEditionFeature('barcode');
  const barcode = useBarcodeLines({
    enabled: barcodeEnabled,
    items,
    setItems,
    products: activeProducts,
    searchProducts: onSearchProducts,
    priceField: 'unitPrice',
    getUnitPrice,
    buildLine: ({ product, qty, price, unit }) =>
      buildSaleLine({ product, qty, unitPrice: price, unit }),
  });
```

  `useInvoiceProductSelection.js` is 197 lines: first move its F2 keydown effect and the debounced search effect into `components/invoice/hooks/useInvoiceSearchEffects.js` (`useInvoiceSearchEffects({ searchKeyword, onSearchProducts, setSearchOpen })`, same code). Return `barcodeEnabled`, `addByCode: barcode.addByCode`, `changeItemUnit: barcode.changeItemUnit`.
- `useInvoiceQuickAdd.js`: accept `addByCode` (optional). `handleQuickAdd` becomes async: when `addByCode` is set and the trimmed keyword has no spaces, `if (await addByCode(keyword)) { playBeep('ok'); setSearchKeyword(''); return; }`, then the existing behaviour.
- Search input on the sales screen: pass `showInput: barcodeEnabled` and `inputPlaceholder: 'Quét hoặc gõ mã vạch / tên hàng...'` in `searchProps` (`invoiceViewProps.js`), and `onChangeUnit: changeItemUnit` in `itemsTableProps`. Thread the two values through `useInvoiceEditorState.js` like `unitSelection` was. Keep both files ≤ 200 lines (combine into one object prop `barcode: { enabled, changeItemUnit }` if needed).
- If sales uses the `sales.itemsTable` slot fallback, the new `onChangeUnit` prop just flows through `itemsTableProps`.

- [ ] **Step 4: Unit select in the table** — `UnitCell.jsx`:

```jsx
import { Select } from 'antd';
import { getItemUnitName, getUnitOptions } from '../../../utils/productUnits.js';

// ĐVT cell: a unit select for products with packaging units, plain text otherwise.
const UnitCell = ({ item, product, index, onChangeUnit, readOnly }) => {
  const options = getUnitOptions(product);
  if (!onChangeUnit || readOnly || options.length < 2) {
    return <td>{getItemUnitName(item, product)}</td>;
  }
  return (
    <td>
      <Select
        size="small"
        value={item.unitName || ''}
        options={options.map(({ value }) => ({ value, label: value || product.unit }))}
        onChange={(value) => onChangeUnit(index, value)}
        popupMatchSelectWidth={false}
      />
    </td>
  );
};

export default UnitCell;
```

`InvoiceItemRow.jsx`: `unit: (row) => <UnitCell item={row.item} product={row.product} index={row.index} onChangeUnit={row.onChangeUnit} readOnly={row.editing.readOnly} />`. `InvoiceItemsTable.jsx`: accept `onChangeUnit` and pass it to each `InvoiceItemRow`.

- [ ] **Step 5: Run** `cd banhang && VITE_API_URL= npx vitest run && npm run lint && npm run build` → PASS. **Commit** `feat(barcode): scan into sales, change line unit`

---

### Task 6: Frontend — purchases wiring

**Files:**
- Modify: `banhang/src/features/purchases/hooks/usePurchasesCatalog.js` (`searchProducts` returns data)
- Modify: `banhang/src/features/purchases/hooks/usePurchasesScreen.js` (call `useBarcodeLines`; already 313 lines — put the call in a new `features/purchases/hooks/usePurchaseBarcode.js` and add a single line to the screen hook)
- Modify: `banhang/src/pages/Purchases/usePurchaseProductModal.js` (`handleQuickAdd` tries `addByCode` first, like sales)
- Modify: `banhang/src/features/purchases/screen/PurchasesScreen.jsx` (pass `onChangeUnit` to the items table; keep ≤ 200 lines)

- [ ] **Step 1: Wire**

```js
// features/purchases/hooks/usePurchaseBarcode.js
import { useEditionFeature } from '../../../platform/useActiveModule.js';
import { useBarcodeLines } from '../../barcode/useBarcodeLines.js';
import { getUnitCostPrice } from '../../../utils/productUnits.js';
import { buildPurchaseLine } from '../domain/purchasesDomain.js';

const buildLine = ({ product, qty, price, unit }) =>
  buildPurchaseLine({ product, qty, unitCost: price, unit });

// Barcode scanning on the purchase screen (inactive when the purchase is read-only).
export const usePurchaseBarcode = ({ items, setItems, products, searchProducts, readOnly }) =>
  useBarcodeLines({
    enabled: useEditionFeature('barcode') && !readOnly,
    items,
    setItems,
    products,
    searchProducts,
    priceField: 'unitCost',
    getUnitPrice: getUnitCostPrice,
    buildLine,
  });
```

(Call `useEditionFeature` unconditionally at the top of the hook body rather than inline if lint's rules-of-hooks complains.)

Read `usePurchasesScreen.js` to find the draft `items`/`setItems`, the products list given to the table, `catalog.searchProducts` and the read-only flag (`draft.readOnlyEdit`). Pass `addByCode` into `usePurchaseProductModal` (new optional option) for its `handleQuickAdd`, and expose `changeItemUnit` to `PurchasesScreen.jsx` for the items table `onChangeUnit`.

- [ ] **Step 2: Run** tests, lint, build. **Commit** `feat(barcode): scan into purchases`

---

### Task 7: Catalog barcode fields

**Files:**
- Modify: `banhang/src/pages/Catalog/CatalogFormModal.jsx` ("Mã vạch" input in the row with "Mã hàng", when `barcode` is on)
- Modify: `banhang/src/pages/Catalog/ProductUnitsField.jsx` (barcode input per unit row when `barcode` is on — pass a `showBarcode` prop)
- Modify: `banhang/src/pages/Catalog/catalogViewConfigs.jsx` (optional "Mã vạch" column only if the column config can read the flag cheaply; otherwise skip)

- [ ] **Step 1:** In `CatalogFormModal.jsx` read `const showBarcode = useEditionFeature('barcode');` (top-level hook call). Change the "Mã hàng" row so that when `showBarcode` is on it has a third `Col` (`md={8}` each) with `<Form.Item label="Mã vạch" name="barcode"><Input placeholder="Quét hoặc nhập mã vạch" /></Form.Item>`; when off the row is unchanged. Pass `showBarcode` to `<ProductUnitsField />`; in the unit row add `<Form.Item name={[name, 'barcode']}><Input placeholder="Mã vạch" style={{ width: 160 }} /></Form.Item>` when `showBarcode`.
- Scanning into these inputs: the scanner hook is not mounted on the catalog page, and the catalog form is a modal, so the scanner types into the focused input followed by Enter. Make sure Enter inside these inputs does not submit/close the modal unexpectedly (Ant Design `Form` without `onFinish` + `Modal` does not submit on Enter; verify).
- Keep files ≤ 200 lines.

- [ ] **Step 2: Run** tests, lint, build. **Commit** `feat(barcode): barcode fields in the catalog`

---

### Task 8: Demo barcodes

**Files:**
- Create: `banhang/src/demo/seed/ean13.js` + test `banhang/src/demo/__tests__/ean13.test.js`
- Modify: `banhang/src/demo/seed/buildMasterData.js` (`toProduct` sets barcodes when the edition has `barcodePrefix`)
- Modify: `banhang/src/demo/editions/minimart/index.js` (`barcodePrefix: '893600'`)
- Modify: `banhang/src/demo/config.js` (`SCHEMA_VERSION = 3`) and tests with hard-coded `bh-demo:v2:` keys
- Modify: `banhang/src/demo/__tests__/seedContract.test.js` (minimart products have barcodes, all unique)

- [ ] **Step 1: EAN-13 helper (TDD)**

```js
// EAN-13 with a valid check digit from 12 digits.
export const ean13 = (twelveDigits) => {
  const digits = String(twelveDigits).padStart(12, '0').slice(-12);
  const sum = [...digits].reduce(
    (acc, digit, index) => acc + Number(digit) * (index % 2 ? 3 : 1),
    0
  );
  return `${digits}${(10 - (sum % 10)) % 10}`;
};
```

Test with known valid codes: `ean13('400638133393')` → `'4006381333931'`, `ean13('978030640615')` → `'9780306406157'`; and the result always has 13 digits.

- [ ] **Step 2:** In `toProduct`, when `edition.barcodePrefix` is set (thread the edition or the prefix into `toProduct` the same way `prefix` is passed): base barcode `ean13(`${prefix}${String(index + 1).padStart(3, '0')}000`)` and each unit `ean13(`${prefix}${String(index + 1).padStart(3, '0')}${String(unitIndex + 1).padStart(3, '0')}`)` (prefix 6 digits + 3 + 3 = 12). Other editions: no barcodes.

- [ ] **Step 3:** Bump `SCHEMA_VERSION` to 3, update hard-coded `v2` keys in demo tests, add the seed contract assertion. Run `cd banhang && VITE_API_URL= npx vitest run src/demo` and `npm run build:demo`. **Commit** `feat(barcode): minimart demo barcodes`

---

### Task 9: Docs and verification

- [ ] Add a short "Barcode scanning" section to `banhang/src/editions/README.md` or the most relevant FE README (where the flag and `features/barcode/` are described: how scanning is detected, F4, search fallback).
- [ ] Spec status → `implemented`.
- [ ] Run everything:

```bash
cd banhang-backend && npx vitest run && npm run lint
cd ../banhang && VITE_API_URL= npx vitest run && npm run lint && npm run build && npm run build:demo && npm run verify:bundles
```

- [ ] Commit `docs(barcode): scanning notes and spec status`.
