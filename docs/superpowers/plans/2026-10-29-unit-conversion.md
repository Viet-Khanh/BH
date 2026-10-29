# Unit Conversion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Products can be bought and sold in packaging units (thùng, lốc) while stock, cost and profit stay in the base unit.

**Architecture:** `Product.units = [{ name, factor, sellPrice }]`. Invoice/purchase lines sold in a packaging unit carry a `unitName` + `factor` snapshot; base-unit lines stay exactly as today (no fields). Every stock/cost consumer reads base quantity through one helper (`getBaseQty = qty × factor`, factor missing → 1). UI is gated by the edition flag `units` (minimart only).

**Tech Stack:** Express + Mongoose (backend, vitest), React 18 + Ant Design (frontend, vitest), browser demo reusing backend modules.

Spec: `docs/superpowers/specs/2026-10-29-unit-conversion-design.md`.

Commands:
- Backend tests: `cd banhang-backend && npx vitest run <path>`
- Frontend tests: `cd banhang && VITE_API_URL= npx vitest run <path>`
- Baseline before this plan: backend 81 tests pass, frontend 198 tests pass.

Rule for lines (used everywhere): a line **without** `unitName` is a base-unit line (factor 1). A line sold in a packaging unit has `unitName` (≠ product base unit) and `factor` > 0.

---

### Task 1: Backend unit helpers

**Files:**
- Create: `banhang-backend/src/utils/productUnits.js`
- Test: `banhang-backend/src/utils/__tests__/productUnits.test.js`

- [ ] **Step 1: Write the failing test**

```js
// banhang-backend/src/utils/__tests__/productUnits.test.js
import { describe, expect, it } from 'vitest';
import {
  getBaseQty,
  getItemFactor,
  normalizeProductUnits,
  resolveLineUnit,
} from '../productUnits.js';

const product = {
  id: 'p1',
  name: 'Coca lon',
  unit: 'lon',
  units: [
    { name: 'lốc', factor: 6, sellPrice: 58000 },
    { name: 'thùng', factor: 24, sellPrice: 220000 },
  ],
};

describe('getItemFactor / getBaseQty', () => {
  it('treats a missing or invalid factor as 1', () => {
    expect(getItemFactor({})).toBe(1);
    expect(getItemFactor({ factor: 0 })).toBe(1);
    expect(getItemFactor({ factor: 'x' })).toBe(1);
    expect(getItemFactor({ factor: 24 })).toBe(24);
    expect(getBaseQty({ qty: 2 })).toBe(2);
    expect(getBaseQty({ qty: 2, factor: 24 })).toBe(48);
    expect(getBaseQty({ qty: '3', factor: '6' })).toBe(18);
    expect(getBaseQty({})).toBe(0);
  });
});

describe('normalizeProductUnits', () => {
  it('trims, coerces numbers and drops empty rows', () => {
    expect(
      normalizeProductUnits(
        [
          { name: ' thùng ', factor: '24', sellPrice: '220000' },
          { name: '', factor: null },
          null,
          { name: 'lốc', factor: 6, sellPrice: null },
        ],
        'lon'
      )
    ).toEqual({
      units: [
        { name: 'thùng', factor: 24, sellPrice: 220000 },
        { name: 'lốc', factor: 6, sellPrice: null },
      ],
      error: null,
    });
  });

  it('returns [] for a missing list', () => {
    expect(normalizeProductUnits(undefined, 'lon')).toEqual({
      units: [],
      error: null,
    });
  });

  it('rejects invalid units', () => {
    expect(normalizeProductUnits([{ name: 'lon', factor: 6 }], 'lon').error).toBe(
      'Đơn vị quy đổi "lon" trùng đơn vị cơ bản.'
    );
    expect(
      normalizeProductUnits(
        [
          { name: 'Thùng', factor: 24 },
          { name: 'thùng', factor: 20 },
        ],
        'lon'
      ).error
    ).toBe('Đơn vị quy đổi "thùng" bị trùng.');
    expect(normalizeProductUnits([{ name: 'thùng', factor: 1 }], 'lon').error).toBe(
      'Hệ số quy đổi của "thùng" phải lớn hơn 1.'
    );
    expect(
      normalizeProductUnits([{ name: 'thùng', factor: 24, sellPrice: -1 }], 'lon')
        .error
    ).toBe('Giá bán của "thùng" phải >= 0.');
    const six = Array.from({ length: 6 }, (_, i) => ({ name: `u${i}`, factor: i + 2 }));
    expect(normalizeProductUnits(six, 'lon').error).toBe(
      'Tối đa 5 đơn vị quy đổi.'
    );
  });
});

describe('resolveLineUnit', () => {
  it('leaves base-unit lines without unit fields', () => {
    expect(resolveLineUnit({ productId: 'p1', qty: 2 }, product)).toEqual({
      productId: 'p1',
      qty: 2,
    });
    expect(
      resolveLineUnit({ productId: 'p1', qty: 2, unitName: 'lon', factor: 1 }, product)
    ).toEqual({ productId: 'p1', qty: 2 });
  });

  it('keeps a snapshot factor and fills a missing one from the product', () => {
    expect(
      resolveLineUnit({ productId: 'p1', qty: 1, unitName: 'thùng', factor: 20 }, product)
    ).toEqual({ productId: 'p1', qty: 1, unitName: 'thùng', factor: 20 });
    expect(
      resolveLineUnit({ productId: 'p1', qty: 1, unitName: 'thùng' }, product)
    ).toEqual({ productId: 'p1', qty: 1, unitName: 'thùng', factor: 24 });
  });

  it('rejects an unknown unit', () => {
    expect(() =>
      resolveLineUnit({ productId: 'p1', qty: 1, unitName: 'két' }, product)
    ).toThrow('Đơn vị "két" không có trong hàng Coca lon.');
  });

  it('returns the item unchanged when the product is unknown', () => {
    const item = { productId: 'x', qty: 1, unitName: 'thùng' };
    expect(resolveLineUnit(item, null)).toBe(item);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd banhang-backend && npx vitest run src/utils/__tests__/productUnits.test.js`
Expected: FAIL — cannot find module `../productUnits.js`.

- [ ] **Step 3: Write the implementation**

```js
// banhang-backend/src/utils/productUnits.js
// Packaging units (thùng, lốc…) over a product's base unit. Stock, cost and
// profit are always computed in base units: base qty = qty × factor.
export const MAX_PRODUCT_UNITS = 5;

export const getItemFactor = (item = {}) => {
  const factor = Number(item?.factor);
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
};

export const getBaseQty = (item = {}) =>
  Number(item?.qty || 0) * getItemFactor(item);

const sameName = (a, b) =>
  String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const toPrice = (value) =>
  value === null || value === undefined || value === '' ? null : Number(value);

const findUnitError = (units, baseUnit) => {
  if (units.length > MAX_PRODUCT_UNITS) {
    return `Tối đa ${MAX_PRODUCT_UNITS} đơn vị quy đổi.`;
  }
  for (const [index, unit] of units.entries()) {
    if (sameName(unit.name, baseUnit)) {
      return `Đơn vị quy đổi "${unit.name}" trùng đơn vị cơ bản.`;
    }
    if (units.slice(0, index).some((other) => sameName(other.name, unit.name))) {
      return `Đơn vị quy đổi "${unit.name}" bị trùng.`;
    }
    if (!Number.isFinite(unit.factor) || unit.factor <= 1) {
      return `Hệ số quy đổi của "${unit.name}" phải lớn hơn 1.`;
    }
    if (unit.sellPrice !== null && !(unit.sellPrice >= 0)) {
      return `Giá bán của "${unit.name}" phải >= 0.`;
    }
  }
  return null;
};

// Cleans the units list from a product payload; `error` is a user message.
export const normalizeProductUnits = (rawUnits, baseUnit) => {
  const units = (Array.isArray(rawUnits) ? rawUnits : [])
    .filter((unit) => String(unit?.name || '').trim())
    .map((unit) => ({
      name: String(unit.name).trim(),
      factor: Number(unit.factor),
      sellPrice: toPrice(unit.sellPrice),
    }));
  return { units, error: findUnitError(units, baseUnit) };
};

// Normalizes the unit of one invoice/purchase line against its product.
// Base-unit lines carry no unit fields (same shape as before units existed).
export const resolveLineUnit = (item, product) => {
  if (!product) return item;
  const { unitName, factor, ...rest } = item;
  const name = String(unitName || '').trim();
  if (!name || sameName(name, product.unit)) return rest;
  const snapshot = Number(factor);
  if (Number.isFinite(snapshot) && snapshot > 0) {
    return { ...rest, unitName: name, factor: snapshot };
  }
  const unit = (product.units || []).find((entry) => sameName(entry.name, name));
  if (!unit) {
    throw new Error(`Đơn vị "${name}" không có trong hàng ${product.name || ''}.`);
  }
  return { ...rest, unitName: unit.name, factor: Number(unit.factor) };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd banhang-backend && npx vitest run src/utils/__tests__/productUnits.test.js`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add banhang-backend/src/utils/productUnits.js banhang-backend/src/utils/__tests__/productUnits.test.js
git commit -m "feat(units): backend helpers for packaging units and base quantity"
```

---

### Task 2: Models

**Files:**
- Modify: `banhang-backend/src/models/Product.js`
- Modify: `banhang-backend/src/models/Invoice.js:3-15`
- Modify: `banhang-backend/src/models/Purchase.js:3-14`

- [ ] **Step 1: Add the product units sub-schema**

In `Product.js`, above `const ProductSchema`:

```js
// Packaging units over the base `unit` (see utils/productUnits.js).
const ProductUnitSchema = new mongoose.Schema(
  {
    name: String,
    factor: Number,
    sellPrice: Number,
  },
  { _id: false }
);
```

and inside `ProductSchema` after `unit: String,`:

```js
    units: { type: [ProductUnitSchema], default: [] },
```

- [ ] **Step 2: Add line snapshot fields**

In `Invoice.js` `InvoiceItemSchema` and in `Purchase.js` `PurchaseItemSchema`, after `qty: Number,` add:

```js
    // Set only for lines in a packaging unit; base qty = qty × factor.
    unitName: String,
    factor: Number,
```

- [ ] **Step 3: Run the demo schema tests (shim must accept the sub-schema)**

Run: `cd banhang && VITE_API_URL= npx vitest run src/demo/__tests__`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add banhang-backend/src/models
git commit -m "feat(units): product units and line unit snapshot in models"
```

---

### Task 3: Stock in base units

**Files:**
- Modify: `banhang-backend/src/services/stockSnapshot.service.js:5-10`
- Modify: `banhang-backend/src/utils/purchaseHelpers.js:121-147,172-177`
- Modify: `banhang-backend/src/utils/stock.js`
- Modify: `banhang-backend/src/modules/dataUpgrade/services/dataUpgrade.service.js:32,41`
- Modify: `banhang-backend/src/modules/reports/services/reportInventory.service.js:93-112`
- Modify: `banhang-backend/src/seedData.js:288-293`
- Test: `banhang-backend/src/services/__tests__/snapshotServices.test.js`, `banhang-backend/src/utils/__tests__/purchaseHelpers.test.js`, `banhang-backend/src/modules/dataUpgrade/services/__tests__/dataUpgrade.service.test.js`

- [ ] **Step 1: Write failing tests**

Append to `snapshotServices.test.js` (inside the existing `describe`):

```js
  it('builds stock deltas in base units for packaging-unit lines', () => {
    expect(
      buildInvoiceCreateStockDeltas([
        { productId: 'p1', qty: 2, unitName: 'thùng', factor: 24 },
        { productId: 'p1', qty: 3 },
      ])
    ).toEqual([{ productId: 'p1', delta: -51 }]);
    expect(
      buildItemUpdateStockDeltas(
        [{ productId: 'p1', qty: 1, unitName: 'thùng', factor: 24 }],
        [{ productId: 'p1', qty: 20 }]
      )
    ).toEqual([{ productId: 'p1', delta: 4 }]);
    expect(
      buildPurchaseStockDeltas([], [{ productId: 'p1', qty: 2, factor: 6 }])
    ).toEqual([{ productId: 'p1', delta: 12 }]);
  });
```

Append to `purchaseHelpers.test.js` (add the imports `buildQtyMapFromInvoices, buildQtyMapFromItems, buildQtyMapFromPurchases` and `import { computeStock } from '../stock.js';` at the top):

```js
describe('base quantity maps', () => {
  const ids = new Set(['p1']);
  const lines = [
    { productId: 'p1', qty: 2, unitName: 'thùng', factor: 24 },
    { productId: 'p1', qty: 1 },
  ];

  it('sums base quantities', () => {
    expect(buildQtyMapFromItems(lines)).toEqual({ p1: 49 });
    expect(buildQtyMapFromPurchases([{ items: lines }], ids)).toEqual({ p1: 49 });
    expect(buildQtyMapFromInvoices([{ items: lines }], ids)).toEqual({ p1: 49 });
  });

  it('computes stock in base units', () => {
    expect(
      computeStock(
        'p1',
        [{ items: [{ productId: 'p1', qty: 1, factor: 24 }] }],
        [{ items: [{ productId: 'p1', qty: 2, factor: 6 }] }],
        [{ id: 'p1', openingStock: 10 }]
      )
    ).toBe(22);
  });
});
```

Append to `dataUpgrade.service.test.js` (import `buildStockSnapshot` from `../dataUpgrade.service.js` if not already imported; follow the file's existing mock setup):

```js
describe('buildStockSnapshot with packaging units', () => {
  it('replays purchases and sales in base units', () => {
    expect(
      buildStockSnapshot({
        products: [{ id: 'p1', openingStock: 10 }],
        purchases: [{ items: [{ productId: 'p1', qty: 1, factor: 24 }] }],
        invoices: [{ items: [{ productId: 'p1', qty: 2, factor: 6 }] }],
      })
    ).toEqual({ p1: 22 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd banhang-backend && npx vitest run src/services/__tests__/snapshotServices.test.js src/utils/__tests__/purchaseHelpers.test.js src/modules/dataUpgrade`
Expected: FAIL — deltas/maps use `qty` without factor (e.g. `-5` instead of `-51`).

- [ ] **Step 3: Use base quantity everywhere stock is computed**

`stockSnapshot.service.js` — add `import { getBaseQty } from '../utils/productUnits.js';` and change the reducer line:

```js
    acc[item.productId] = (acc[item.productId] || 0) + getBaseQty(item);
```

`purchaseHelpers.js` — add `import { getBaseQty } from './productUnits.js';` and replace `Number(item.qty || 0)` with `getBaseQty(item)` in `buildQtyMapFromPurchases`, `buildQtyMapFromInvoices` and `buildQtyMapFromItems` (3 places).

`stock.js` — add `import { getBaseQty } from './productUnits.js';` and replace both `acc + Number(item.qty || 0)` with `acc + getBaseQty(item)`.

`dataUpgrade.service.js` — add `import { getBaseQty } from '../../../utils/productUnits.js';`; replace `num(item.qty)` with `getBaseQty(item)` at both lines (`+=` and `-=`).

`reportInventory.service.js` — add `import { getBaseQty } from '../../../utils/productUnits.js';`; in `getStockMovementReport` replace both `const qty = Number(item.qty || 0);` with `const qty = getBaseQty(item);`.

`seedData.js` — add `import { getBaseQty } from './utils/productUnits.js';`; replace `Number(item.qty || 0)` with `getBaseQty(item)` in the two stock loops.

- [ ] **Step 4: Run tests**

Run: `cd banhang-backend && npx vitest run`
Expected: PASS (all, including the new tests).

- [ ] **Step 5: Commit**

```bash
git add banhang-backend/src
git commit -m "feat(units): compute stock from base quantities"
```

---

### Task 4: Purchases keep units and cost per base unit

**Files:**
- Modify: `banhang-backend/src/utils/purchaseHelpers.js:149-167` (`sanitizePurchaseItems`)
- Modify: `banhang-backend/src/modules/purchases/services/purchases.service.js` (`buildCostMapFromItems` 77-88, `updatePurchase`, `createPurchase`)
- Test: `banhang-backend/src/modules/purchases/services/__tests__/purchases.service.test.js`, `banhang-backend/src/utils/__tests__/purchaseHelpers.test.js`

- [ ] **Step 1: Write failing tests**

Append to `purchaseHelpers.test.js` (import `sanitizePurchaseItems`):

```js
describe('sanitizePurchaseItems', () => {
  it('keeps the unit snapshot of packaging-unit lines', () => {
    const [line] = sanitizePurchaseItems([
      { productId: 'p1', qty: 2, unitCost: 200000, unitName: 'thùng', factor: 24 },
    ]);
    expect(line).toMatchObject({
      productId: 'p1',
      qty: 2,
      unitCost: 200000,
      unitName: 'thùng',
      factor: 24,
      lineTotal: 400000,
    });
  });

  it('adds no unit fields to base-unit lines', () => {
    const [line] = sanitizePurchaseItems([{ productId: 'p1', qty: 2, unitCost: 5 }]);
    expect(line).not.toHaveProperty('unitName');
    expect(line).not.toHaveProperty('factor');
  });
});
```

Append to `purchases.service.test.js` inside the existing `describe` (same `beforeEach`):

```js
  it('adds stock and average cost in base units when buying cartons', async () => {
    repository.findProductsByIds.mockResolvedValue([
      {
        id: 'p1',
        name: 'Coca lon',
        unit: 'lon',
        units: [{ name: 'thùng', factor: 24 }],
        openingStock: 24,
        stock: 24,
        avgCost: 7000,
      },
    ]);
    repository.createPurchaseDoc.mockImplementation(async (doc) => doc);

    const { purchase } = await createPurchase({
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 2, unitCost: 192000, unitName: 'thùng' }],
    });

    expect(purchase.items[0]).toMatchObject({ unitName: 'thùng', factor: 24 });
    expect(repository.updateProductById).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ openingStock: 72, stock: 72, avgCost: 7667 })
    );
  });

  it('rejects a purchase line in an unknown unit', async () => {
    repository.findProductsByIds.mockResolvedValue([
      { id: 'p1', name: 'Coca lon', unit: 'lon', units: [], openingStock: 0 },
    ]);
    await expect(
      createPurchase({
        supplierId: 's1',
        items: [{ productId: 'p1', qty: 1, unitCost: 1, unitName: 'két' }],
      })
    ).rejects.toThrow('Đơn vị "két" không có trong hàng Coca lon.');
    expect(repository.updateProductById).not.toHaveBeenCalled();
  });

  it('recomputes average cost in base units when a carton purchase is edited', async () => {
    repository.findPurchaseById.mockResolvedValue({
      id: 'po1',
      supplierId: 's1',
      appliedToStock: true,
      items: [{ productId: 'p1', qty: 1, unitCost: 240000, unitName: 'thùng', factor: 24 }],
    });
    repository.findProductsByIds.mockResolvedValue([
      {
        id: 'p1',
        unit: 'lon',
        units: [{ name: 'thùng', factor: 24 }],
        openingStock: 24,
        stock: 24,
        avgCost: 10000,
      },
    ]);
    repository.updatePurchaseDoc.mockImplementation(async (_id, doc) => doc);

    await updatePurchase('po1', {
      supplierId: 's1',
      items: [{ productId: 'p1', qty: 1, unitCost: 192000, unitName: 'thùng', factor: 24 }],
    });

    expect(repository.updateProductById).toHaveBeenCalledWith(
      'p1',
      expect.objectContaining({ avgCost: 8000 })
    );
  });
```

(Numbers: create — old 24 lon at 7000 + 48 lon at 192000/24 = 8000 → (168000 + 384000) / 72 = 7666.67 → 7667. Edit — the whole stock is the edited carton; replacing 10000/lon by 8000/lon gives 8000.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd banhang-backend && npx vitest run src/modules/purchases src/utils/__tests__/purchaseHelpers.test.js`
Expected: FAIL — unit fields stripped, `openingStock: 26`, wrong avgCost, no unknown-unit error.

- [ ] **Step 3: Keep the unit snapshot in `sanitizePurchaseItems`**

Replace the function in `purchaseHelpers.js`:

```js
export const sanitizePurchaseItems = (items = []) =>
  items.map((item) => {
    const qty = Number(item.qty || 0);
    const unitCost = Number(item.unitCost || 0);
    return {
      productId: item.productId,
      qty,
      unitCost,
      ...(item.unitName
        ? { unitName: String(item.unitName), factor: item.factor }
        : {}),
      lineNote: item.lineNote || '',
      length: item.length ?? null,
      width: item.width ?? null,
      lineTotal: getLineTotal({
        qty,
        unitCost,
        length: item.length,
        width: item.width,
      }),
    };
  });
```

- [ ] **Step 4: Resolve units and use base quantities in the purchase service**

In `purchases.service.js` add imports (the final form is shown at the end of this step):

```js
import {
  getBaseQty,
  getItemFactor,
  resolveLineUnit,
} from '../../../utils/productUnits.js';
```

Add a helper after `buildCostMapFromItems`:

```js
// Unit snapshot per line, checked against the loaded products (throws on unknown unit).
const resolvePurchaseUnits = (items, products) => {
  const productById = buildByIdMap(products);
  return items.map((item) => resolveLineUnit(item, productById[item.productId]));
};
```

Change `buildCostMapFromItems` so `qty` is base quantity and `value` stays line qty × unit cost:

```js
const buildCostMapFromItems = (items = []) =>
  items.reduce((acc, item) => {
    if (!item?.productId) return acc;
    const qty = getBaseQty(item);
    const value = Number(item.qty || 0) * Number(item.unitCost || 0);
    const current = acc[item.productId] || { qty: 0, value: 0 };
    acc[item.productId] = {
      qty: current.qty + qty,
      value: current.value + value,
    };
    return acc;
  }, {});
```

`updatePurchase`: the product list is loaded after the maps today. Move the product load before the maps and resolve units first. Replace the block from `const sanitizedItems = sanitizePurchaseItems(items);` down to (and including) `if (products.length !== productIds.size) throw new Error('Product not found');` with:

```js
  const cleanItems = sanitizePurchaseItems(items);
  const invalid = findInvalidPurchaseItem(cleanItems);
  if (invalid) throw new Error('Invalid purchase item');

  const productIds = new Set([
    ...(existingPurchase.items || []).map((item) => item.productId),
    ...cleanItems.map((item) => item.productId),
  ]);
  const products = productIds.size
    ? await findProductsByIds([...productIds], { activeOnly: true })
    : [];
  if (products.length !== productIds.size) throw new Error('Product not found');
  const sanitizedItems = resolvePurchaseUnits(cleanItems, products);

  const oldQtyMap = buildQtyMapFromItems(existingPurchase.items || []);
  const nextQtyMap = buildQtyMapFromItems(sanitizedItems);
  const oldCostMap = shouldUpdateAvgCost
    ? buildCostMapFromItems(existingPurchase.items || [])
    : {};
  const nextCostMap = shouldUpdateAvgCost
    ? buildCostMapFromItems(sanitizedItems)
    : {};
  const shouldRecomputeAvgCost =
    shouldUpdateAvgCost &&
    [...productIds].some((productId) =>
      hasAvgCostImpact(oldCostMap[productId], nextCostMap[productId])
    );
```

(`buildQtyMapFromItems` is imported from `purchaseHelpers.js` and already uses base qty after Task 3.)

`createPurchase`: after `const productMap = buildByIdMap(products);` is too late — resolve right after the product check. Replace:

```js
  const sanitizedItems = sanitizePurchaseItems(items);
  const invalid = findInvalidPurchaseItem(sanitizedItems);
  if (invalid) throw new Error('Invalid purchase item');

  const productIds = [...new Set(sanitizedItems.map((item) => item.productId))];
  const products = await findProductsByIds(productIds, { activeOnly: true });
  if (products.length !== productIds.length)
    throw new Error('Product not found');
```

with:

```js
  const cleanItems = sanitizePurchaseItems(items);
  const invalid = findInvalidPurchaseItem(cleanItems);
  if (invalid) throw new Error('Invalid purchase item');

  const productIds = [...new Set(cleanItems.map((item) => item.productId))];
  const products = await findProductsByIds(productIds, { activeOnly: true });
  if (products.length !== productIds.length)
    throw new Error('Product not found');
  const sanitizedItems = resolvePurchaseUnits(cleanItems, products);
```

and inside `sanitizedItems.forEach((item) => { … })`, replace the `nextAvgCost` and `updates[item.productId]` statements with base quantity and cost per base unit:

```js
    const baseQty = getBaseQty(item);
    const baseUnitCost = Number(item.unitCost || 0) / getItemFactor(item);
    const nextAvgCost = shouldUpdateAvgCost
      ? computeAvgCost(oldQty, current.avgCost, baseQty, baseUnitCost)
      : null;
    updates[item.productId] = {
      openingStock: Number(current.openingStock || 0) + baseQty,
      ...(snapshotReady
        ? { stock: Number(current.stock || 0) + baseQty }
        : {}),
      ...(shouldUpdateAvgCost ? { avgCost: nextAvgCost } : {}),
      ...(snapshotReady ? { stockUpdatedAt: new Date().toISOString() } : {}),
    };
```

The import added at the top of this step is therefore:

```js
import {
  getBaseQty,
  getItemFactor,
  resolveLineUnit,
} from '../../../utils/productUnits.js';
```

- [ ] **Step 5: Run tests**

Run: `cd banhang-backend && npx vitest run`
Expected: PASS (all).

- [ ] **Step 6: Commit**

```bash
git add banhang-backend/src
git commit -m "feat(units): purchases keep the unit snapshot and cost per base unit"
```

---

### Task 5: Invoices resolve line units

**Files:**
- Create: `banhang-backend/src/services/itemUnits.service.js`
- Modify: `banhang-backend/src/modules/invoices/services/invoices.service.js` (`createInvoiceItem`, `updateInvoiceItem`)
- Test: `banhang-backend/src/services/__tests__/itemUnits.service.test.js`

- [ ] **Step 1: Write the failing test**

```js
// banhang-backend/src/services/__tests__/itemUnits.service.test.js
import { describe, expect, it, vi } from 'vitest';

const productModel = vi.hoisted(() => ({ find: vi.fn() }));
vi.mock('../../models/Product.js', () => ({ default: productModel }));

const { resolveItemUnits } = await import('../itemUnits.service.js');

const mockProducts = (products) =>
  productModel.find.mockReturnValue({
    lean: vi.fn().mockResolvedValue(products),
  });

describe('resolveItemUnits', () => {
  it('does not query products when no line has a unit', async () => {
    productModel.find.mockReset();
    const items = [{ productId: 'p1', qty: 1 }];
    expect(await resolveItemUnits(items)).toBe(items);
    expect(productModel.find).not.toHaveBeenCalled();
  });

  it('fills the factor of packaging-unit lines', async () => {
    mockProducts([
      { id: 'p1', name: 'Coca', unit: 'lon', units: [{ name: 'thùng', factor: 24 }] },
    ]);
    expect(
      await resolveItemUnits([
        { productId: 'p1', qty: 1, unitName: 'thùng' },
        { productId: 'p1', qty: 2, unitName: 'lon', factor: 1 },
      ])
    ).toEqual([
      { productId: 'p1', qty: 1, unitName: 'thùng', factor: 24 },
      { productId: 'p1', qty: 2 },
    ]);
  });

  it('rejects unknown units', async () => {
    mockProducts([{ id: 'p1', name: 'Coca', unit: 'lon', units: [] }]);
    await expect(
      resolveItemUnits([{ productId: 'p1', qty: 1, unitName: 'két' }])
    ).rejects.toThrow('Đơn vị "két" không có trong hàng Coca.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd banhang-backend && npx vitest run src/services/__tests__/itemUnits.service.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// banhang-backend/src/services/itemUnits.service.js
import Product from '../models/Product.js';
import { resolveLineUnit } from '../utils/productUnits.js';

// Normalizes the unit snapshot of sale lines; only loads products when a line has a unit.
export const resolveItemUnits = async (items = []) => {
  const ids = [
    ...new Set(items.filter((item) => item?.unitName).map((item) => item.productId)),
  ];
  if (!ids.length) return items;
  const products = await Product.find(
    { id: { $in: ids } },
    { id: 1, name: 1, unit: 1, units: 1 }
  ).lean();
  const productById = new Map(products.map((product) => [product.id, product]));
  return items.map((item) =>
    item?.unitName ? resolveLineUnit(item, productById.get(item.productId)) : item
  );
};
```

- [ ] **Step 4: Call it in the invoices service**

In `invoices.service.js` add `import { resolveItemUnits } from '../../../services/itemUnits.service.js';`.

In `createInvoiceItem`, right after `if (!cleanPayload.id) cleanPayload.id = uuid();`:

```js
  if (Array.isArray(cleanPayload.items)) {
    cleanPayload.items = await resolveItemUnits(cleanPayload.items);
  }
```

In `updateInvoiceItem`, right after `const cleanPayload = stripEinvoiceFields(sanitizePayload(payload));`:

```js
  if (Array.isArray(cleanPayload.items)) {
    cleanPayload.items = await resolveItemUnits(cleanPayload.items);
  }
```

- [ ] **Step 5: Run tests**

Run: `cd banhang-backend && npx vitest run`
Expected: PASS (all).

- [ ] **Step 6: Commit**

```bash
git add banhang-backend/src
git commit -m "feat(units): resolve the unit snapshot of sale lines"
```

---

### Task 6: Product units validation

**Files:**
- Modify: `banhang-backend/src/services/crud.service.js` (`createItem`, `bulkCreateItems`, `updateItem`)
- Test: `banhang-backend/src/services/__tests__/crud.service.test.js`

- [ ] **Step 1: Write failing tests**

Append to `crud.service.test.js` (add `createItem` to the import list; `createProductModel` is defined at the top of the file — add `create: vi.fn().mockImplementation(async (doc) => doc)` to its returned object):

```js
describe('crud.service product units', () => {
  it('normalizes units on create', async () => {
    const ProductModel = createProductModel({ existing: null });
    const created = await createItem(ProductModel, {
      name: 'Coca',
      unit: 'lon',
      units: [{ name: ' thùng ', factor: '24', sellPrice: '' }],
    });
    expect(created.units).toEqual([
      { name: 'thùng', factor: 24, sellPrice: null },
    ]);
  });

  it('rejects invalid units on create and update', async () => {
    const ProductModel = createProductModel({
      existing: { id: 'p1', name: 'Coca', unit: 'lon' },
    });
    await expect(
      createItem(ProductModel, {
        name: 'Coca 2',
        unit: 'lon',
        units: [{ name: 'thùng', factor: 1 }],
      })
    ).rejects.toThrow('Hệ số quy đổi của "thùng" phải lớn hơn 1.');
    await expect(
      updateItem(ProductModel, 'p1', { units: [{ name: 'lon', factor: 6 }] })
    ).rejects.toThrow('Đơn vị quy đổi "lon" trùng đơn vị cơ bản.');
  });

  it('validates units against the new base unit when both change', async () => {
    const ProductModel = createProductModel({
      existing: { id: 'p1', name: 'Coca', unit: 'lon' },
      updated: { id: 'p1' },
    });
    await updateItem(ProductModel, 'p1', {
      unit: 'chai',
      units: [{ name: 'lon', factor: 2 }],
    });
    expect(ProductModel.findOneAndUpdate).toHaveBeenCalledWith(
      { id: 'p1' },
      { $set: expect.objectContaining({ units: [{ name: 'lon', factor: 2, sellPrice: null }] }) },
      expect.any(Object)
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd banhang-backend && npx vitest run src/services/__tests__/crud.service.test.js`
Expected: FAIL — units are stored as given, no errors thrown.

- [ ] **Step 3: Implement**

In `crud.service.js` add `import { normalizeProductUnits } from '../utils/productUnits.js';` and a helper after `prepareCreatePayload`:

```js
// Cleans `units` in a product payload (only when present); throws a user message.
const applyProductUnits = (payload, baseUnit) => {
  if (payload.units === undefined) return payload;
  const { units, error } = normalizeProductUnits(payload.units, baseUnit);
  if (error) throw new Error(error);
  return { ...payload, units };
};
```

`createItem`: inside `if (Model.modelName === 'Product') {`, first line:

```js
    cleanPayload = applyProductUnits(cleanPayload, cleanPayload.unit);
```

`bulkCreateItems`: inside `if (Model.modelName === 'Product') {`, first line:

```js
    payload = payload.map((item) => applyProductUnits(item, item.unit));
```

`updateItem`: change `const cleanPayload = sanitizePayload(payload);` to `let cleanPayload = sanitizePayload(payload);`, and inside the Product branch right after the `if (!existing) { … }` block:

```js
    cleanPayload = applyProductUnits(
      cleanPayload,
      cleanPayload.unit ?? existing.unit
    );
```

- [ ] **Step 4: Run tests**

Run: `cd banhang-backend && npx vitest run`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add banhang-backend/src
git commit -m "feat(units): validate product units on save"
```

---

### Task 7: Profit, report lines and purchase export

**Files:**
- Modify: `banhang-backend/src/utils/reportHelpers.js` (`getInvoiceItemCostTotal` 129-134, `buildInvoiceItems` 401-428)
- Modify: `banhang-backend/src/modules/purchases/services/purchases.service.js` (`getRecentPurchases` export `DVT`, ~line 235)
- Test: `banhang-backend/src/utils/__tests__/reportHelpers.test.js`

- [ ] **Step 1: Write failing tests**

Append to `reportHelpers.test.js`:

```js
describe('packaging-unit lines', () => {
  const cartonInvoice = {
    id: 'inv-2',
    date: '2026-10-29T00:00:00.000Z',
    items: [
      {
        productId: 'p1',
        qty: 2,
        unitName: 'thùng',
        factor: 24,
        unitPrice: 220000,
        lineTotal: 440000,
        costPriceSnapshot: 8000,
      },
    ],
  };
  const productMap = { p1: { id: 'p1', name: 'Coca', unit: 'lon' } };

  it('computes cost from base quantity', () => {
    expect(buildInvoiceProfitFinancials(cartonInvoice, productMap)).toEqual({
      revenue: 440000,
      cost: 384000,
      profit: 56000,
    });
  });

  it('shows the line unit and base quantity', () => {
    expect(buildInvoiceItems(cartonInvoice, productMap)[0]).toMatchObject({
      unit: 'thùng',
      qty: 2,
      baseUnit: 'lon',
      baseQty: 48,
      costTotal: 384000,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd banhang-backend && npx vitest run src/utils/__tests__/reportHelpers.test.js`
Expected: FAIL — cost 16000, unit `lon`, no `baseQty`.

- [ ] **Step 3: Implement**

`reportHelpers.js` — add `import { getBaseQty } from './productUnits.js';`.

```js
export const getInvoiceItemCostTotal = (item, productMap = {}) => {
  const product = productMap[item.productId] || {};
  const costUnit = Number(item.costPriceSnapshot ?? product.avgCost ?? 0);
  return getBaseQty(item) * costUnit * getAreaMultiplier(item);
};
```

In `buildInvoiceItems`, replace `unit: product.unit || '',` with:

```js
      unit: item.unitName || product.unit || '',
      baseUnit: product.unit || '',
      baseQty: getBaseQty(item),
```

`purchases.service.js` `getRecentPurchases`: replace `DVT: product.unit || '',` with `DVT: item.unitName || product.unit || '',`.

- [ ] **Step 4: Run tests**

Run: `cd banhang-backend && npx vitest run`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add banhang-backend/src
git commit -m "feat(units): profit and report lines use base quantity and line unit"
```

---

### Task 8: E-invoice line unit and change detection

**Files:**
- Modify: `banhang-backend/src/modules/einvoice/domain/lineMapper.js:15`
- Modify: `banhang-backend/src/modules/einvoice/domain/contentChange.js:4-12`
- Modify: `banhang/src/features/einvoice/domain/contentChange.js:5-13`
- Test: `banhang-backend/src/modules/einvoice/__tests__/taxAndLines.test.js`, `banhang/src/features/einvoice/__tests__/contentChange.test.js`

- [ ] **Step 1: Write failing tests**

Append to `taxAndLines.test.js`:

```js
describe('mapLine with a packaging unit', () => {
  it('uses the line unit so quantity × price = amount', () => {
    expect(
      mapLine(
        { qty: 2, unitName: 'thùng', factor: 24, unitPrice: 220000, lineTotal: 440000 },
        { name: 'Coca', unit: 'lon', code: 'C1' }
      )
    ).toMatchObject({ unit: 'thùng', quantity: 2, unitPrice: 220000, amount: 440000 });
  });
});
```

In `banhang/src/features/einvoice/__tests__/contentChange.test.js` add to `cases`:

```js
  ['line unit', { ...base, items: [{ ...base.items[0], unitName: 'thùng', factor: 24 }] }],
```

and add a test after the `it.each` (inside the same `describe`):

```js
  it('flags a unit change as content', () => {
    expect(
      hasContentChange(base, {
        ...base,
        items: [{ ...base.items[0], unitName: 'thùng', factor: 24 }],
      })
    ).toBe(true);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd banhang-backend && npx vitest run src/modules/einvoice` and `cd banhang && VITE_API_URL= npx vitest run src/features/einvoice`
Expected: FAIL — unit `lon`; unit change not flagged.

- [ ] **Step 3: Implement**

`lineMapper.js`: `const unit = item.unitName || product?.unit || '';`

Both `contentChange.js` files — `LINE_FIELDS` becomes:

```js
const LINE_FIELDS = [
  'productId',
  'qty',
  'unitName',
  'factor',
  'unitPrice',
  'lineTotal',
  'length',
  'width',
  'lineNote',
];
```

- [ ] **Step 4: Run tests**

Run: `cd banhang-backend && npx vitest run` and `cd banhang && VITE_API_URL= npx vitest run src/features/einvoice`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add banhang-backend/src banhang/src/features/einvoice
git commit -m "feat(units): e-invoice lines use the line unit"
```

---

### Task 9: Frontend unit helpers

**Files:**
- Create: `banhang/src/utils/productUnits.js`
- Test: `banhang/src/utils/__tests__/productUnits.test.js`

- [ ] **Step 1: Write the failing test**

```js
// banhang/src/utils/__tests__/productUnits.test.js
import { describe, expect, it } from 'vitest';
import { getBaseQty as backendGetBaseQty } from '@backend/utils/productUnits.js';
import {
  findProductUnit,
  formatStockByUnits,
  formatUnitsSummary,
  getBaseQty,
  getItemUnitName,
  getUnitCostPrice,
  getUnitOptions,
  getUnitSellPrice,
} from '../productUnits.js';

const product = {
  id: 'p1',
  unit: 'lon',
  stock: 51,
  sellPriceDefault: 10000,
  avgCost: 8000,
  units: [
    { name: 'lốc', factor: 6, sellPrice: null },
    { name: 'thùng', factor: 24, sellPrice: 220000 },
  ],
};

describe('productUnits (frontend)', () => {
  it('matches the backend base quantity', () => {
    [{ qty: 2 }, { qty: 2, factor: 24 }, { qty: 1, factor: 0 }, {}].forEach((item) =>
      expect(getBaseQty(item)).toBe(backendGetBaseQty(item))
    );
  });

  it('lists the base unit first, then packaging units', () => {
    expect(getUnitOptions(product)).toEqual([
      { value: '', label: 'lon', factor: 1 },
      { value: 'lốc', label: 'lốc (6 lon)', factor: 6 },
      { value: 'thùng', label: 'thùng (24 lon)', factor: 24 },
    ]);
    expect(getUnitOptions({ unit: 'cái' })).toEqual([
      { value: '', label: 'cái', factor: 1 },
    ]);
  });

  it('finds units by name', () => {
    expect(findProductUnit(product, 'thùng')).toEqual(product.units[1]);
    expect(findProductUnit(product, '')).toBeNull();
    expect(findProductUnit(product, 'két')).toBeNull();
  });

  it('prices units', () => {
    expect(getUnitSellPrice(product, '')).toBe(10000);
    expect(getUnitSellPrice(product, 'thùng')).toBe(220000);
    expect(getUnitSellPrice(product, 'lốc')).toBe(60000);
    expect(getUnitCostPrice(product, '')).toBe(8000);
    expect(getUnitCostPrice(product, 'thùng')).toBe(192000);
  });

  it('formats stock by units', () => {
    expect(formatStockByUnits(product)).toBe('2 thùng 3 lon');
    expect(formatStockByUnits({ ...product, stock: 6 })).toBe('1 lốc');
    expect(formatStockByUnits({ ...product, stock: 0 })).toBe('0 lon');
    expect(formatStockByUnits({ ...product, stock: -5 })).toBe('-5 lon');
    expect(formatStockByUnits({ unit: 'cái', stock: 3 })).toBe('3 cái');
  });

  it('summarizes units and names line units', () => {
    expect(formatUnitsSummary(product)).toBe('lon (lốc 6, thùng 24)');
    expect(formatUnitsSummary({ unit: 'cái' })).toBe('cái');
    expect(getItemUnitName({ unitName: 'thùng' }, product)).toBe('thùng');
    expect(getItemUnitName({}, product)).toBe('lon');
    expect(getItemUnitName({}, null)).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd banhang && VITE_API_URL= npx vitest run src/utils/__tests__/productUnits.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```js
// banhang/src/utils/productUnits.js
// Packaging units (thùng, lốc…) over a product's base unit. Mirrors the
// quantity rule of banhang-backend/src/utils/productUnits.js (parity test).
const unitsOf = (product) => (Array.isArray(product?.units) ? product.units : []);

export const getItemFactor = (item = {}) => {
  const factor = Number(item?.factor);
  return Number.isFinite(factor) && factor > 0 ? factor : 1;
};

export const getBaseQty = (item = {}) =>
  Number(item?.qty || 0) * getItemFactor(item);

export const findProductUnit = (product, unitName) => {
  if (!unitName) return null;
  return unitsOf(product).find((unit) => unit.name === unitName) || null;
};

// Select options; value '' is the base unit.
export const getUnitOptions = (product) => [
  { value: '', label: product?.unit || '', factor: 1 },
  ...unitsOf(product).map((unit) => ({
    value: unit.name,
    label: `${unit.name} (${unit.factor} ${product?.unit || ''})`,
    factor: Number(unit.factor),
  })),
];

export const getUnitSellPrice = (product, unitName) => {
  const base = Number(product?.sellPriceDefault || 0);
  const unit = findProductUnit(product, unitName);
  if (!unit) return base;
  const price = unit.sellPrice;
  return price === null || price === undefined || price === ''
    ? Math.round(base * Number(unit.factor))
    : Number(price);
};

export const getUnitCostPrice = (product, unitName) => {
  const base = Number(product?.avgCost || 0);
  const unit = findProductUnit(product, unitName);
  return unit ? Math.round(base * Number(unit.factor)) : base;
};

const round3 = (value) => Math.round(value * 1000) / 1000;

// "2 thùng 3 lon": largest unit first, zero parts skipped.
export const formatStockByUnits = (product) => {
  const stock = Number(product?.stock ?? product?.openingStock ?? 0);
  const baseUnit = product?.unit || '';
  const units = [...unitsOf(product)].sort((a, b) => b.factor - a.factor);
  if (!units.length || stock <= 0) return `${stock} ${baseUnit}`.trim();
  let rest = stock;
  const parts = [];
  units.forEach((unit) => {
    const count = Math.floor(rest / unit.factor);
    if (count > 0) parts.push(`${count} ${unit.name}`);
    rest = round3(rest - count * unit.factor);
  });
  if (rest > 0) parts.push(`${rest} ${baseUnit}`);
  return parts.join(' ');
};

export const formatUnitsSummary = (product) => {
  const units = unitsOf(product);
  if (!units.length) return product?.unit || '';
  const list = units.map((unit) => `${unit.name} ${unit.factor}`).join(', ');
  return `${product?.unit || ''} (${list})`;
};

export const getItemUnitName = (item, product) =>
  item?.unitName || product?.unit || '';
```

- [ ] **Step 4: Run test**

Run: `cd banhang && VITE_API_URL= npx vitest run src/utils/__tests__/productUnits.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add banhang/src/utils/productUnits.js banhang/src/utils/__tests__/productUnits.test.js
git commit -m "feat(units): frontend unit helpers"
```

---

### Task 10: Edition flag `units`

**Files:**
- Modify: `banhang/src/editions/{nhomkinh,vlxd,minimart,fashion,pharmacy}/index.js` (`features`)
- Modify: `banhang/src/platform/__tests__/editions.test.js:27-30`
- Modify: `banhang/src/editions/README.md` (flag table)

- [ ] **Step 1: Update the shape test (fails first)**

```js
    expect(edition.config.features).toEqual({
      dimensions: expect.any(Boolean),
      sampleData: expect.any(Boolean),
      units: expect.any(Boolean),
    });
```

Run: `cd banhang && VITE_API_URL= npx vitest run src/platform`
Expected: FAIL for every edition.

- [ ] **Step 2: Add the flag**

`minimart/index.js`: `features: { dimensions: false, sampleData: false, units: true },`
Every other edition: add `units: false` to its existing `features` object.

- [ ] **Step 3: Document it**

In `banhang/src/editions/README.md`, add a row to the "Where config is read" table after `features.sampleData`:

```md
| `features.units`                    | `pages/Catalog/CatalogFormModal.jsx`, `components/invoice/productModal/InvoiceProductModal.jsx`                                                                     |
```

- [ ] **Step 4: Run tests**

Run: `cd banhang && VITE_API_URL= npx vitest run src/platform`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add banhang/src/editions banhang/src/platform
git commit -m "feat(units): edition flag units (minimart on)"
```

---

### Task 11: Catalog — edit units, show them, search them

**Files:**
- Create: `banhang/src/pages/Catalog/ProductUnitsField.jsx`
- Modify: `banhang/src/pages/Catalog/CatalogFormModal.jsx` (after the ĐVT row, ~line 59)
- Modify: `banhang/src/pages/Catalog/catalogViewConfigs.jsx:27` (ĐVT column)
- Modify: `banhang/src/utils/searchText.js` (`buildSearchText`)
- Modify: `banhang/src/pages/Catalog/catalogUtils.js:8-27` (reuse the shared search helpers)
- Test: `banhang/src/utils/__tests__/searchText.test.js` (new)

- [ ] **Step 1: Write the failing search test**

```js
// banhang/src/utils/__tests__/searchText.test.js
import { describe, expect, it } from 'vitest';
import { buildSearchText, hasSearchMatch } from '../searchText.js';

describe('searchText', () => {
  const product = { name: 'Coca', units: [{ name: 'thùng', factor: 24 }] };

  it('flattens nested unit objects', () => {
    expect(buildSearchText(product)).not.toContain('[object Object]');
    expect(hasSearchMatch(product, 'thung')).toBe(true);
  });
});
```

Run: `cd banhang && VITE_API_URL= npx vitest run src/utils/__tests__/searchText.test.js`
Expected: FAIL.

- [ ] **Step 2: Flatten nested values**

`utils/searchText.js`:

```js
const flattenValue = (value) => {
  if (Array.isArray(value)) return value.map(flattenValue).join(' ');
  if (value && typeof value === 'object') {
    return Object.values(value).map(flattenValue).join(' ');
  }
  return value;
};

export const buildSearchText = (record) =>
  Object.values(record ?? {})
    .filter((value) => value !== null && value !== undefined)
    .map(flattenValue)
    .join(' ');
```

`catalogUtils.js`: delete its own `normalizeSearchText`, `buildSearchText` and `hasSearchMatch` definitions and re-export the shared ones at the top of the file:

```js
export {
  buildSearchText,
  hasSearchMatch,
  normalizeSearchText,
} from '../../utils/searchText.js';
```

If `catalogUtils.js` itself calls `normalizeSearchText` (e.g. `normalizeHeader`), also add `import { normalizeSearchText } from '../../utils/searchText.js';`.

Run: `cd banhang && VITE_API_URL= npx vitest run src/utils src/pages`
Expected: PASS.

- [ ] **Step 3: Create the units editor**

```jsx
// banhang/src/pages/Catalog/ProductUnitsField.jsx
import { Button, Form, Input, InputNumber, Space } from 'antd';
import { formatNumberInput, parseNumberInput } from './catalogUtils.js';

// Packaging units (thùng, lốc…) of a product; the backend validates the list.
const ProductUnitsField = () => (
  <Form.Item label="Đơn vị quy đổi (tùy chọn)">
    <Form.List name="units">
      {(fields, { add, remove }) => (
        <>
          {fields.map(({ key, name }) => (
            <Space key={key} align="baseline" wrap>
              <Form.Item name={[name, 'name']} rules={[{ required: true, message: 'Nhập tên' }]}>
                <Input placeholder="Tên (vd: thùng)" />
              </Form.Item>
              <Form.Item
                name={[name, 'factor']}
                rules={[{ required: true, message: 'Nhập hệ số' }]}
              >
                <InputNumber min={1} placeholder="= bao nhiêu ĐVT" />
              </Form.Item>
              <Form.Item name={[name, 'sellPrice']}>
                <InputNumber
                  min={0}
                  placeholder="Giá bán (trống = tự tính)"
                  style={{ width: 200 }}
                  formatter={formatNumberInput}
                  parser={parseNumberInput}
                />
              </Form.Item>
              <Button onClick={() => remove(name)}>Xóa</Button>
            </Space>
          ))}
          {fields.length < 5 && (
            <Button type="dashed" onClick={() => add()}>
              + Thêm đơn vị quy đổi
            </Button>
          )}
        </>
      )}
    </Form.List>
  </Form.Item>
);

export default ProductUnitsField;
```

- [ ] **Step 4: Render it in the product form**

`CatalogFormModal.jsx`:
- change `import { useEdition } from '../../platform/useActiveModule.js';` to `import { useEdition, useEditionFeature } from '../../platform/useActiveModule.js';`
- add `import ProductUnitsField from './ProductUnitsField.jsx';`
- in the component body after `const { labels } = useEdition();` add `const showUnits = useEditionFeature('units');`
- right after the `</Row>` that closes the ĐVT row add:

```jsx
          {showUnits && <ProductUnitsField />}
```

No payload change is needed: `useCatalogForm.js` and `salesDomain.js` `buildProductPayload` spread `values`, so `units` is sent; the backend normalizes it.

- [ ] **Step 5: Show units in the catalog list**

`catalogViewConfigs.jsx`: add `import { formatUnitsSummary } from '../../utils/productUnits.js';` and change the ĐVT column to:

```js
      { title: 'ĐVT', dataIndex: 'unit', render: (_, record) => formatUnitsSummary(record) },
```

- [ ] **Step 6: Run tests and lint**

Run: `cd banhang && VITE_API_URL= npx vitest run && npm run lint`
Expected: PASS, no lint errors.

- [ ] **Step 7: Commit**

```bash
git add banhang/src
git commit -m "feat(units): edit and search product units in the catalog"
```

---

### Task 12: Unit choice in the product modal (sales)

**Files:**
- Create: `banhang/src/components/invoice/productModal/usePendingUnit.js`
- Create: `banhang/src/components/invoice/productModal/UnitPicker.jsx`
- Modify: `banhang/src/components/invoice/productModal/ProductInfoPanel.jsx`
- Modify: `banhang/src/components/invoice/productModal/InvoiceProductModal.jsx`
- Modify: `banhang/src/components/invoice/invoiceProductHandlers.js`
- Modify: `banhang/src/components/invoice/invoiceItemHandlers.js`
- Modify: `banhang/src/components/invoice/hooks/useInvoiceProductSelection.js`
- Modify: `banhang/src/components/invoice/hooks/useInvoiceComputedState.js` (previous price key)
- Modify: `banhang/src/components/invoice/useInvoiceEditorState.js`, `banhang/src/components/invoice/invoiceViewProps.js`
- Test: `banhang/src/components/invoice/__tests__/invoiceItemHandlers.test.js` (new)

- [ ] **Step 1: Write the failing test for line building**

```js
// banhang/src/components/invoice/__tests__/invoiceItemHandlers.test.js
import { describe, expect, it, vi } from 'vitest';
import { createConfirmAddHandler } from '../invoiceItemHandlers.js';

const run = (pendingUnit) => {
  let items = [];
  const confirm = createConfirmAddHandler({
    pendingProduct: { id: 'p1', avgCost: 8000 },
    pendingQty: 2,
    pendingPrice: 220000,
    pendingLength: null,
    pendingWidth: null,
    pendingUnit,
    setItems: (update) => {
      items = update(items);
    },
    setSearchOpen: vi.fn(),
    setPendingQty: vi.fn(),
    setPendingLength: vi.fn(),
    setPendingWidth: vi.fn(),
  });
  confirm();
  return items[0];
};

describe('createConfirmAddHandler', () => {
  it('adds the unit snapshot for a packaging unit', () => {
    expect(run({ value: 'thùng', factor: 24 })).toMatchObject({
      productId: 'p1',
      qty: 2,
      unitPrice: 220000,
      lineTotal: 440000,
      unitName: 'thùng',
      factor: 24,
      costPriceSnapshot: 8000,
    });
  });

  it('adds no unit fields for the base unit', () => {
    const line = run({ value: '', factor: 1 });
    expect(line).not.toHaveProperty('unitName');
    expect(line).not.toHaveProperty('factor');
    expect(run(undefined)).not.toHaveProperty('unitName');
  });
});
```

Run: `cd banhang && VITE_API_URL= npx vitest run src/components/invoice/__tests__/invoiceItemHandlers.test.js`
Expected: FAIL — `unitName` missing.

- [ ] **Step 2: Add the unit to new lines**

`invoiceItemHandlers.js`: add `pendingUnit,` to the destructured options (after `pendingWidth,`), and in `newItem` after `width: dimensions.width,` add:

```js
      ...(pendingUnit?.value
        ? { unitName: pendingUnit.value, factor: pendingUnit.factor }
        : {}),
```

Run the test again. Expected: PASS.

- [ ] **Step 3: Create the pending unit hook**

```js
// banhang/src/components/invoice/productModal/usePendingUnit.js
import { useCallback, useState } from 'react';
import { findProductUnit } from '../../../utils/productUnits.js';

// Unit chosen in the product modal ('' = base unit). Callers reset it with
// setUnitName('') whenever they pick a new product.
export const usePendingUnit = ({ pendingProduct, getUnitPrice, setPendingPrice }) => {
  const [unitName, setUnitName] = useState('');

  const onChange = useCallback(
    (nextUnitName = '') => {
      if (!pendingProduct) return;
      setUnitName(nextUnitName);
      setPendingPrice(getUnitPrice(pendingProduct, nextUnitName));
    },
    [getUnitPrice, pendingProduct, setPendingPrice]
  );

  const unit = findProductUnit(pendingProduct, unitName);
  return {
    setUnitName,
    selection: {
      value: unit ? unit.name : '',
      factor: unit ? Number(unit.factor) : 1,
      onChange,
    },
  };
};
```

- [ ] **Step 4: Create the picker**

```jsx
// banhang/src/components/invoice/productModal/UnitPicker.jsx
import { Radio } from 'antd';
import { getUnitOptions } from '../../../utils/productUnits.js';

// Base unit / packaging units of the chosen product; hidden when it has none.
const UnitPicker = ({ product, selection }) => {
  const options = getUnitOptions(product);
  if (!selection || options.length < 2) return null;
  return (
    <div>
      <div>Đơn vị</div>
      <Radio.Group
        optionType="button"
        value={selection.value}
        onChange={(event) => selection.onChange(event.target.value)}
        options={options.map(({ value, label }) => ({ value, label }))}
      />
    </div>
  );
};

export default UnitPicker;
```

- [ ] **Step 5: Show the picker and stock by units**

`ProductInfoPanel.jsx`:
- add imports `import { formatStockByUnits } from '../../../utils/productUnits.js';` and `import UnitPicker from './UnitPicker.jsx';`
- add `unitSelection,` to the props list (after `showDimensions,`)
- replace the stock line block

```jsx
        <div>
          Tồn kho:{' '}
          {Number(pendingProduct?.stock ?? pendingProduct?.openingStock ?? 0)}
        </div>
```

with

```jsx
        <div>Tồn kho: {formatStockByUnits(pendingProduct)}</div>
```

- insert before `<LabeledNumber label="Số lượng"`:

```jsx
      <UnitPicker product={pendingProduct} selection={unitSelection} />
```

`InvoiceProductModal.jsx`:
- add `unitSelection,` to the props list (after `onApplyPreviousPrice,`)
- add `const unitsEnabled = useEditionFeature('units');` after `const editionDimensions = useEditionFeature('dimensions');`
- pass to the panel: `unitSelection={unitsEnabled ? unitSelection : undefined}`

- [ ] **Step 6: Wire the sales selection hook**

`invoiceProductHandlers.js`: both `createOpenAddModal` and `createPendingProductChangeHandler` take an extra option `setPendingUnitName` and call `setPendingUnitName?.('');` right after `setPendingProduct(product);`.

`useInvoiceProductSelection.js`:
- add imports `import { usePendingUnit } from '../productModal/usePendingUnit.js';` and `import { getUnitSellPrice } from '../../../utils/productUnits.js';`
- after the `useState` declarations add:

```js
  const getUnitPrice = useCallback(
    (product, unitName) => {
      if (unitName) return getUnitSellPrice(product, unitName);
      return typeof getProductPrice === 'function'
        ? getProductPrice(product)
        : Number(product.sellPriceDefault || 0);
    },
    [getProductPrice]
  );
  const pendingUnit = usePendingUnit({
    pendingProduct,
    getUnitPrice,
    setPendingPrice,
  });
```

- pass `setPendingUnitName: pendingUnit.setUnitName,` to `createOpenAddModal({...})` and `createPendingProductChangeHandler({...})`
- `pendingPreviousPrice` uses the unit:

```js
  const pendingPreviousPrice = useMemo(() => {
    if (!pendingProduct?.id) return null;
    const previousPrice = getPreviousProductPrice(
      pendingProduct.id,
      undefined,
      pendingUnit.selection.value
    );
    return Number.isFinite(previousPrice) ? Number(previousPrice) : null;
  }, [getPreviousProductPrice, pendingProduct, pendingUnit.selection.value]);
```

- pass `pendingUnit: pendingUnit.selection,` to `createConfirmAddHandler({...})`
- return `unitSelection: pendingUnit.selection,`

If the file grows past 200 lines, move `filteredQuick` + `handleQuickAdd` into `components/invoice/hooks/useInvoiceQuickAdd.js` (same code, returns `{ filteredQuick, handleQuickAdd }`).

`useInvoiceComputedState.js` — key previous prices by unit (base unit keeps today's key):

```js
const buildProductPriceKey = (customerId, productId, unitName = '') =>
  `${customerId || DEFAULT_CUSTOMER_PRICE_KEY}::${productId}${unitName ? `::${unitName}` : ''}`;
```

- in `previousInvoicePrices` call `buildProductPriceKey(currentInvoice.customerId, productId, invoiceItem.unitName)`
- `getPreviousProductPrice` becomes `(productId, nextCustomerId = customerId, unitName = '')` and builds the key with `unitName`.

`useInvoiceEditorState.js`: in the `buildInvoiceViewProps({...})` call add `unitSelection: productSelection.unitSelection,`.
`invoiceViewProps.js`: add `unitSelection,` to the destructured parameters and `unitSelection,` to `productModalProps`.

- [ ] **Step 7: Run tests and lint**

Run: `cd banhang && VITE_API_URL= npx vitest run && npm run lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add banhang/src
git commit -m "feat(units): choose the unit when adding a sale line"
```

---

### Task 13: Unit choice in purchases

**Files:**
- Modify: `banhang/src/pages/Purchases/usePurchaseProductModal.js`
- Modify: `banhang/src/features/purchases/screen/PurchasesScreen.jsx:139-156`

- [ ] **Step 1: Wire the hook**

`usePurchaseProductModal.js`:
- add imports `import { usePendingUnit } from '../../components/invoice/productModal/usePendingUnit.js';` and `import { getUnitCostPrice } from '../../utils/productUnits.js';`
- after the `useState` declarations:

```js
  const pendingUnit = usePendingUnit({
    pendingProduct,
    getUnitPrice: getUnitCostPrice,
    setPendingPrice,
  });
```

- in `openAddModal` and `handlePendingProductChange`, after `setPendingProduct(product);` add `pendingUnit.setUnitName('');`
- in `resetSearchState` add `pendingUnit.setUnitName('');` (and add `pendingUnit` to its dependency list)
- in `handleConfirmAdd`, inside the new line object after `width: dimensions.width,`:

```js
        ...(pendingUnit.selection.value
          ? {
              unitName: pendingUnit.selection.value,
              factor: pendingUnit.selection.factor,
            }
          : {}),
```

- return `unitSelection: pendingUnit.selection,`

`PurchasesScreen.jsx`: add `unitSelection={productSelection.unitSelection}` to `<InvoiceProductModal …>`.

`features/purchases/domain/purchasesDomain.js` needs no change: `normalizePurchaseItem` spreads the item.

- [ ] **Step 2: Run tests and lint**

Run: `cd banhang && VITE_API_URL= npx vitest run && npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add banhang/src
git commit -m "feat(units): choose the unit when adding a purchase line"
```

---

### Task 14: Show the line unit everywhere

**Files:**
- Modify: `banhang/src/components/invoice/itemsTable/InvoiceItemRow.jsx:62`
- Modify: `banhang/src/utils/printItems.js:87`
- Modify: `banhang/src/pages/Purchases/PurchaseDetailModal.jsx:38`
- Modify: `banhang/src/pages/Reports/reportPurchaseUtils.js:55`
- Modify: `banhang/src/pages/Reports/ReportStockOutTab.jsx:77-93`
- Test: `banhang/src/utils/__tests__/printItems.test.js`

- [ ] **Step 1: Write the failing print test**

Append to `printItems.test.js` (import `buildPrintRows` if not imported):

```js
describe('buildPrintRows unit', () => {
  it('prints the line unit for packaging-unit lines', () => {
    const products = [{ id: 'p1', name: 'Coca', unit: 'lon' }];
    const [carton, single] = buildPrintRows(
      [
        { productId: 'p1', qty: 1, unitName: 'thùng', factor: 24 },
        { productId: 'p1', qty: 2 },
      ],
      products
    );
    expect(carton.unit).toBe('thùng');
    expect(single.unit).toBe('lon');
  });
});
```

Run: `cd banhang && VITE_API_URL= npx vitest run src/utils/__tests__/printItems.test.js`
Expected: FAIL — `lon` for the carton line.

- [ ] **Step 2: Use `getItemUnitName`**

Each file below imports `getItemUnitName` from `utils/productUnits.js` (relative path per file):

- `printItems.js:87`: `unit: getItemUnitName(item, product),`
- `InvoiceItemRow.jsx:62`: `unit: ({ item, product }) => <td>{getItemUnitName(item, product)}</td>,`
- `PurchaseDetailModal.jsx:38`: `<td>{getItemUnitName(item, product)}</td>`
- `reportPurchaseUtils.js:55`: `unit: getItemUnitName(item, product),`

Check `InvoiceItemRow.jsx` cell renderers receive `item` in their row argument (other cells use `row.item` / `{ item }`); keep the same destructuring style.

- [ ] **Step 3: Stock-out report sums base quantity in the base unit**

`ReportStockOutTab.jsx`, in `itemRows`:

```js
        const key = item.productId || `${item.name}-${item.unit}-${item.spec}`;
        const current = map.get(key) || {
          productId: item.productId || '',
          name: item.name || 'Sản phẩm',
          unit: item.baseUnit ?? item.unit ?? '',
          spec: item.spec || '',
          qty: 0,
          amount: 0,
          cost: 0,
          profit: 0,
        };
        const qty = Number(item.baseQty ?? item.qty ?? 0);
```

(`baseUnit`/`baseQty` come from the backend `buildInvoiceItems`, Task 7.)

- [ ] **Step 4: Run tests and lint**

Run: `cd banhang && VITE_API_URL= npx vitest run && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add banhang/src
git commit -m "feat(units): show the line unit on screens, prints and reports"
```

---

### Task 15: Demo — minimart sample data with units

**Files:**
- Modify: `banhang/src/demo/editions/minimart/products.js` (9th column)
- Modify: `banhang/src/demo/seed/buildMasterData.js` (`toProduct`)
- Modify: `banhang/src/demo/seed/transactionFactories.js` (`makePurchase`, `makeInvoice`)
- Modify: `banhang/src/demo/seed/replayTransactions.js` (`buildInvoiceItems`, `replayPurchase`)
- Modify: `banhang/src/demo/__tests__/seedContract.test.js:31-42`
- Modify: `banhang/src/demo/config.js` (`SCHEMA_VERSION = 2`)

- [ ] **Step 1: Make the stock contract unit-aware (fails once units are seeded)**

`seedContract.test.js` — import `getBaseQty` from `'../../utils/productUnits.js'` and change the `sold` sum:

```js
        (item) => (item.productId === product.id ? getBaseQty(item) : 0)
```

Add a test in the same `describe`:

```js
  it('seeds packaging units for the minimart', async () => {
    if (edition.id !== 'minimart') return;
    const products = await get('/products');
    const invoices = await get('/invoices');
    expect(products.some((product) => product.units?.length)).toBe(true);
    expect(
      invoices.some((invoice) => invoice.items.some((item) => item.unitName))
    ).toBe(true);
  });
```

- [ ] **Step 2: Seed units**

`products.js` — update the header comment to `// [group, name, unit, spec, avgCost, sellPriceDefault, sellPriceWholesale, openingStock, units?]` and add a 9th element (`[name, factor, sellPrice]` triples) to these rows:

```js
  ['Đồ uống', 'Nước suối Aquafina 500ml', 'chai', '500ml', 3500, 5000, 4500, 120, [['thùng', 24, 108000]]],
  ['Đồ uống', 'Coca-Cola lon 320ml', 'lon', '320ml', 7000, 10000, 9000, 96, [['lốc', 6, 58000], ['thùng', 24, 220000]]],
  ['Đồ uống', 'Pepsi lon 320ml', 'lon', '320ml', 6800, 10000, 8800, 96, [['lốc', 6, 58000], ['thùng', 24, 215000]]],
  ['Đồ uống', 'Bia Sài Gòn Lager lon 330ml', 'lon', '330ml', 10500, 13000, 12000, 120, [['lốc', 6, 76000], ['thùng', 24, 295000]]],
  ['Đồ uống', 'Sữa tươi Vinamilk 180ml', 'hộp', '180ml', 6200, 8000, 7200, 96, [['lốc', 4, 31000], ['thùng', 48, 360000]]],
  ['Mì - đồ khô', 'Mì Hảo Hảo tôm chua cay', 'gói', '75g', 3600, 5000, 4300, 150, [['thùng', 30, 135000]]],
  ['Mì - đồ khô', 'Mì Omachi sườn hầm', 'gói', '80g', 6800, 9000, 8000, 90, [['thùng', 30, 250000]]],
```

`buildMasterData.js` `toProduct` — destructure a 9th element `units = []` and add to the returned product:

```js
    units: units.map(([unitName, factor, sellPrice]) => ({
      name: unitName,
      factor,
      sellPrice,
    })),
```

`transactionFactories.js`:

```js
const pickUnit = (random, product) =>
  product.units?.length && random.chance(0.4) ? random.pick(product.units) : null;
```

In `makePurchase` items map:

```js
    const unit = pickUnit(random, product);
    const qty = unit ? random.int(1, 2) : random.int(minQty, maxQty);
    const factor = unit ? unit.factor : 1;
    stock.add(product.id, qty * factor);
    const unitCost = roundPrice(
      product.avgCost * factor * (0.95 + random.next() * 0.1)
    );
    return {
      productId: product.id,
      qty,
      unitCost,
      ...(unit ? { unitName: unit.name, factor } : {}),
    };
```

In `makeInvoice` items map (sell a whole unit only when stock allows):

```js
    const unit = pickUnit(random, product);
    const factor =
      unit && stock.available(product.id) >= unit.factor ? unit.factor : 1;
    const wanted = factor > 1 ? 1 : random.int(1, edition.activity.maxQty);
    const qty = Math.min(Math.floor(stock.available(product.id) / factor), wanted);
    stock.take(product.id, qty * factor);
    const wholesale = profile !== 'walkin' && random.chance(0.5);
    return {
      productId: product.id,
      qty,
      priceType: wholesale ? 'wholesale' : 'retail',
      ...(factor > 1 ? { unitName: unit.name, factor } : {}),
    };
```

`replayTransactions.js` `buildInvoiceItems` — price per unit (wholesale scaled by factor):

```js
  eventItems.map(({ productId, qty, priceType, unitName, factor = 1 }) => {
    const product = productById.get(productId);
    const unit = product.units?.find((entry) => entry.name === unitName);
    const basePrice =
      priceType === 'wholesale'
        ? product.sellPriceWholesale
        : product.sellPriceDefault;
    const unitPrice =
      unit && priceType !== 'wholesale' && unit.sellPrice != null
        ? unit.sellPrice
        : basePrice * factor;
    return {
      productId,
      qty,
      unitPrice,
      lineTotal: qty * unitPrice,
      lineNote: '',
      costPriceSnapshot: Number(product.avgCost || 0),
      excludeFromProfitSnapshot: Boolean(product.excludeFromProfit),
      ...(unit ? { unitName, factor } : {}),
    };
  });
```

`replayPurchase` already spreads `...item`, so `unitName`/`factor` reach the API.

`config.js`: `export const SCHEMA_VERSION = 2;`

- [ ] **Step 3: Run demo tests**

Run: `cd banhang && VITE_API_URL= npx vitest run src/demo`
Expected: PASS (stock contract holds with base quantities; minimart has unit lines).

- [ ] **Step 4: Commit**

```bash
git add banhang/src/demo
git commit -m "feat(units): minimart demo data sold and bought in cartons"
```

---

### Task 16: Docs and full verification

**Files:**
- Modify: `banhang-backend/README.md` (utilities section: `utils/productUnits.js` rule)
- Modify: `docs/superpowers/specs/2026-10-29-unit-conversion-design.md` (status → implemented)

- [ ] **Step 1: Document the rule for future code**

Add to `banhang-backend/README.md` in its conventions/rules section:

```md
- Quantities: invoice/purchase lines may be in a packaging unit (`unitName`, `factor`).
  Stock, cost and profit must use `getBaseQty(item)` from `src/utils/productUnits.js`,
  never `item.qty` directly.
```

Set `Status: implemented` in the spec header.

- [ ] **Step 2: Full verification**

Run:
```bash
cd banhang-backend && npx vitest run && npm run lint
cd ../banhang && VITE_API_URL= npx vitest run && npm run lint && npm run build && npm run verify:bundles
```
Expected: all tests pass, no lint errors, builds succeed, bundle check passes.

- [ ] **Step 3: Grep for leftovers**

Run: `grep -rn "item.qty" banhang-backend/src --include=*.js | grep -v __tests__`
Expected: only display/amount uses (line totals, e-invoice quantity, `qtySum`), no stock/cost computation.

- [ ] **Step 4: Commit**

```bash
git add banhang-backend/README.md docs/superpowers/specs/2026-10-29-unit-conversion-design.md
git commit -m "docs(units): base quantity rule and spec status"
```
