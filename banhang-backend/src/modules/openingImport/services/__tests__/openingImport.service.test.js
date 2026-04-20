import { describe, expect, it, vi } from 'vitest';
import {
  commitOpeningImport,
  previewOpeningImport,
} from '../openingImport.service.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const matchesCondition = (value, condition) => {
  if (condition && typeof condition === 'object' && !Array.isArray(condition)) {
    if ('$exists' in condition) {
      const exists = value !== undefined;
      if (exists !== condition.$exists) return false;
    }
    if ('$ne' in condition && value === condition.$ne) return false;
    if ('$nin' in condition && condition.$nin.includes(value)) return false;
    if ('$in' in condition && !condition.$in.includes(value)) return false;
    return true;
  }

  return value === condition;
};

const matchesFilter = (doc, filter = {}) =>
  Object.entries(filter).every(([key, condition]) => {
    if (key === '$or') {
      return condition.some((item) => matchesFilter(doc, item));
    }
    return matchesCondition(doc[key], condition);
  });

const createFakeModel = (seed = []) => {
  let docs = seed.map(clone);
  const model = {
    failInsertMessage: null,
    countDocuments: vi.fn(async (filter = {}) =>
      docs.filter((doc) => matchesFilter(doc, filter)).length
    ),
    find: vi.fn(async (filter = {}) =>
      docs.filter((doc) => matchesFilter(doc, filter)).map(clone)
    ),
    insertMany: vi.fn(async (payload) => {
      if (model.failInsertMessage) throw new Error(model.failInsertMessage);
      docs = docs.concat(payload.map(clone));
      return payload;
    }),
    deleteMany: vi.fn(async (filter = {}) => {
      docs = docs.filter((doc) => !matchesFilter(doc, filter));
      return { acknowledged: true };
    }),
    getDocs: () => docs.map(clone),
  };
  return model;
};

const createDeps = (seed = {}) => {
  let idCounter = 0;
  return {
    now: () => '2026-04-20T10:00:00.000Z',
    generateId: () => `gen-${++idCounter}`,
    models: {
      Customer: createFakeModel(seed.customers),
      Supplier: createFakeModel(seed.suppliers),
      Invoice: createFakeModel(seed.invoices),
      Purchase: createFakeModel(seed.purchases),
      Payment: createFakeModel(seed.payments),
    },
  };
};

describe('openingImport.service', () => {
  it('previews customer rows and computes summary correctly', async () => {
    const deps = createDeps();

    const result = await previewOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: '  Công ty A  ',
            phone: '0909',
            address: 'HCM',
            openingBalance: '1.250,5',
          },
        ],
      },
      deps
    );

    expect(result.errors).toEqual([]);
    expect(result.normalizedRows).toEqual([
      {
        rowNumber: 2,
        name: 'Công ty A',
        phone: '0909',
        address: 'HCM',
        openingBalance: 1250.5,
      },
    ]);
    expect(result.summary.totalRows).toBe(1);
    expect(result.summary.validRows).toBe(1);
    expect(result.summary.totalPositiveBalance).toBe(1250.5);
  });

  it('previews supplier rows correctly', async () => {
    const deps = createDeps();

    const result = await previewOpeningImport(
      {
        target: 'suppliers',
        rows: [
          {
            rowNumber: 2,
            name: 'NCC A',
            phone: '',
            address: '',
            openingBalance: '-500000',
          },
        ],
      },
      deps
    );

    expect(result.errors).toEqual([]);
    expect(result.summary.negativeCount).toBe(1);
    expect(result.summary.totalNegativeBalance).toBe(-500000);
  });

  it('reports missing opening balance column in preview', async () => {
    const deps = createDeps();

    const result = await previewOpeningImport(
      {
        target: 'customers',
        rows: [{ rowNumber: 2, name: 'Khách A' }],
      },
      deps
    );

    expect(result.errors.some((item) => item.code === 'MISSING_COLUMN')).toBe(
      true
    );
    expect(result.summary.validRows).toBe(0);
  });

  it('reports invalid opening balance values in preview', async () => {
    const deps = createDeps();

    const result = await previewOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: 'Khách A',
            openingBalance: 'abc',
          },
        ],
      },
      deps
    );

    expect(
      result.errors.some((item) => item.code === 'INVALID_OPENING_BALANCE')
    ).toBe(true);
  });

  it('reports duplicate rows in preview', async () => {
    const deps = createDeps();

    const result = await previewOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: 'Khách A',
            phone: '0909',
            address: 'HN',
            openingBalance: 100,
          },
          {
            rowNumber: 3,
            name: 'Khách A',
            phone: '0909',
            address: 'HN',
            openingBalance: 100,
          },
        ],
      },
      deps
    );

    expect(result.errors.some((item) => item.code === 'DUPLICATE_ROW')).toBe(
      true
    );
  });

  it('allows preview when customer scope already has data but imported names are new', async () => {
    const deps = createDeps({
      customers: [{ id: 'c1', name: 'Khách thật', isDeleted: false }],
      invoices: [{ id: 'i1', customerId: 'c1', isDeleted: false }],
      payments: [
        {
          id: 'p1',
          customerId: 'c1',
          paymentType: 'debt_receipt',
          isDeleted: false,
        },
      ],
    });

    const result = await previewOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: 'Khách A',
            openingBalance: 100,
          },
        ],
      },
      deps
    );

    expect(result.errors).toEqual([]);
    expect(result.summary.validRows).toBe(1);
  });

  it('reports existing customer names in preview', async () => {
    const deps = createDeps({
      customers: [
        { id: 'c1', name: 'Khách lẻ', isDeleted: false },
        { id: 'c2', name: 'Công ty Minh An', isDeleted: false },
      ],
    });

    const result = await previewOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: 'Cong ty Minh An',
            openingBalance: 100,
          },
        ],
      },
      deps
    );

    expect(result.errors).toContainEqual({
      rowNumber: 2,
      field: 'name',
      code: 'EXISTING_NAME',
      message: 'Tên khách hàng đã tồn tại trong hệ thống: Công ty Minh An.',
    });
    expect(result.summary.validRows).toBe(0);
  });

  it('commits positive customer balances as invoices', async () => {
    const deps = createDeps();

    const result = await commitOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: 'Khách A',
            phone: '0909',
            address: 'HN',
            openingBalance: 100,
          },
        ],
      },
      deps
    );

    expect(result.created).toEqual({ masters: 1, debtDocs: 1 });
    expect(deps.models.Customer.getDocs()).toHaveLength(1);
    expect(deps.models.Invoice.getDocs()).toHaveLength(1);
    expect(deps.models.Payment.getDocs()).toHaveLength(0);
    expect(deps.models.Invoice.getDocs()[0].paymentStatus).toBe('CHUA THU');
  });

  it('commits negative customer balances as debt receipts', async () => {
    const deps = createDeps();

    await commitOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: 'Khách A',
            openingBalance: -250,
          },
        ],
      },
      deps
    );

    expect(deps.models.Customer.getDocs()).toHaveLength(1);
    expect(deps.models.Payment.getDocs()).toHaveLength(1);
    expect(deps.models.Payment.getDocs()[0].paymentType).toBe('debt_receipt');
  });

  it('commits new customers even when customer scope already has data', async () => {
    const deps = createDeps({
      customers: [{ id: 'c1', name: 'Khách thật', isDeleted: false }],
      invoices: [{ id: 'i1', customerId: 'c1', isDeleted: false }],
      payments: [
        {
          id: 'p1',
          customerId: 'c1',
          paymentType: 'debt_receipt',
          isDeleted: false,
        },
      ],
    });

    const result = await commitOpeningImport(
      {
        target: 'customers',
        rows: [
          {
            rowNumber: 2,
            name: 'Khách mới',
            openingBalance: 300,
          },
        ],
      },
      deps
    );

    expect(result.created).toEqual({ masters: 1, debtDocs: 1 });
    expect(deps.models.Customer.getDocs()).toHaveLength(2);
    expect(deps.models.Invoice.getDocs()).toHaveLength(2);
  });

  it('commits positive supplier balances as purchases', async () => {
    const deps = createDeps();

    await commitOpeningImport(
      {
        target: 'suppliers',
        rows: [
          {
            rowNumber: 2,
            name: 'NCC A',
            openingBalance: 900,
          },
        ],
      },
      deps
    );

    expect(deps.models.Supplier.getDocs()).toHaveLength(1);
    expect(deps.models.Purchase.getDocs()).toHaveLength(1);
    expect(deps.models.Purchase.getDocs()[0].appliedToStock).toBe(false);
  });

  it('commits negative supplier balances as supplier debt payments', async () => {
    const deps = createDeps();

    await commitOpeningImport(
      {
        target: 'suppliers',
        rows: [
          {
            rowNumber: 2,
            name: 'NCC A',
            openingBalance: -900,
          },
        ],
      },
      deps
    );

    expect(deps.models.Supplier.getDocs()).toHaveLength(1);
    expect(deps.models.Payment.getDocs()).toHaveLength(1);
    expect(deps.models.Payment.getDocs()[0].paymentType).toBe(
      'supplier_debt_payment'
    );
  });

  it('commits zero balance rows without debt documents', async () => {
    const deps = createDeps();

    const result = await commitOpeningImport(
      {
        target: 'suppliers',
        rows: [
          {
            rowNumber: 2,
            name: 'NCC A',
            openingBalance: 0,
          },
        ],
      },
      deps
    );

    expect(result.created).toEqual({ masters: 1, debtDocs: 0 });
    expect(deps.models.Supplier.getDocs()).toHaveLength(1);
    expect(deps.models.Purchase.getDocs()).toHaveLength(0);
    expect(deps.models.Payment.getDocs()).toHaveLength(0);
  });

  it('rolls back inserted documents when commit fails midway', async () => {
    const deps = createDeps();
    deps.models.Payment.failInsertMessage = 'boom';

    await expect(
      commitOpeningImport(
        {
          target: 'customers',
          rows: [
            {
              rowNumber: 2,
              name: 'Khách A',
              openingBalance: -100,
            },
          ],
        },
        deps
      )
    ).rejects.toMatchObject({
      message: 'Import thất bại. Dữ liệu vừa tạo đã được rollback.',
      status: 500,
    });

    expect(deps.models.Customer.getDocs()).toHaveLength(0);
    expect(deps.models.Payment.getDocs()).toHaveLength(0);
    expect(deps.models.Customer.deleteMany).toHaveBeenCalled();
  });
});
