import { describe, expect, it } from 'vitest';
import {
  buildChangeFlagPatch,
  hasContentChange,
  stripEinvoiceFields,
} from '../domain/contentChange.js';
import { buildDocument } from '../domain/documentBuilder.js';
import { validateDocument, validateSettings } from '../domain/validation.js';

const products = new Map([
  ['p1', { id: 'p1', code: 'A', name: 'Bia', unit: 'lon', vatRate: '10' }],
  ['p2', { id: 'p2', code: 'B', name: 'Gạo', unit: 'bao' }],
]);
const invoice = {
  id: 'i1',
  code: 'INV-1',
  date: '2026-10-26T03:00:00.000Z',
  customerId: 'c1',
  items: [
    { productId: 'p1', qty: 2, unitPrice: 11000, lineTotal: 22000 },
    { productId: 'p2', qty: 1, unitPrice: 108000, lineTotal: 108000 },
  ],
  total: 130000,
  discountTotal: 0,
};
const customer = {
  id: 'c1',
  name: 'Công ty An Phát',
  taxCode: '0312345678',
  address: 'Q.5',
  email: 'ke.toan@anphat.vn',
};
const settings = {
  shopName: 'Tạp hoá Minh Anh',
  sellerTaxCode: '8012345678',
  taxMethod: 'deduction',
  defaultVatRate: '8',
};
const build = (overrides = {}) =>
  buildDocument({
    invoice,
    customer,
    productById: products,
    payments: [{ method: 'bank', amount: 130000 }],
    settings,
    ...overrides,
  });

describe('buildDocument', () => {
  it('builds a VAT document with per-line rates', () => {
    const doc = build();
    expect(doc).toMatchObject({
      invoiceId: 'i1',
      code: 'INV-1',
      taxMethod: 'deduction',
      paymentMethod: 'CK',
      seller: { taxCode: '8012345678', name: 'Tạp hoá Minh Anh' },
      buyer: { companyName: 'Công ty An Phát', taxCode: '0312345678' },
    });
    expect(
      doc.lines.map((line) => [line.vatRate, line.beforeTax, line.tax])
    ).toEqual([
      ['10', 20000, 2000],
      ['8', 100000, 8000],
    ]);
    expect(doc.totals).toEqual({
      beforeTax: 120000,
      tax: 10000,
      total: 130000,
    });
  });

  it('builds a sales document without tax for household businesses', () => {
    const doc = build({ settings: { ...settings, taxMethod: 'direct' } });
    expect(doc.taxMethod).toBe('direct');
    expect(doc.lines[0].vatRate).toBeUndefined();
    expect(doc.totals).toEqual({ beforeTax: 130000, tax: 0, total: 130000 });
  });

  it('treats a customer without tax code as an individual buyer', () => {
    const doc = build({ customer: { id: 'c2', name: 'Khách lẻ' } });
    expect(doc.buyer).toMatchObject({ name: 'Khách lẻ', companyName: '' });
  });
});

describe('validation', () => {
  it('warns about the 8% rate after 31/12/2026 (Vietnam time)', () => {
    const at = (date) =>
      validateDocument(build({ invoice: { ...invoice, date } })).map(
        (issue) => issue.message
      );
    expect(at('2026-12-31T16:00:00.000Z').join()).not.toMatch('8%');
    expect(at('2026-12-31T17:00:00.000Z').join()).toMatch('8%');
  });

  it('blocks export without seller tax code', () => {
    expect(validateSettings({})[0].message).toMatch('mã số thuế người bán');
    expect(validateSettings(settings)).toEqual([]);
  });

  it('reports line errors and buyer warnings', () => {
    const doc = build({
      invoice: {
        ...invoice,
        items: [{ productId: 'p1', qty: 0, unitPrice: -1 }],
      },
      customer: { ...customer, address: '' },
      productById: new Map([['p1', { id: 'p1', name: 'X', vatRate: '7' }]]),
    });
    const issues = validateDocument(doc);
    expect(issues.filter((issue) => issue.level === 'error')).toHaveLength(3);
    expect(issues.find((issue) => issue.level === 'warning').message).toMatch(
      'địa chỉ'
    );
  });
});

describe('content change', () => {
  const exported = { ...invoice, einvoice: { exportedAt: '2026-10-26' } };

  it('ignores payment-only changes and number formatting', () => {
    expect(
      hasContentChange(exported, { ...exported, paymentStatus: 'DA THU' })
    ).toBe(false);
    const sameAsStrings = {
      ...exported,
      total: '130000',
      items: exported.items.map((item) => ({ ...item, qty: String(item.qty) })),
    };
    expect(hasContentChange(exported, sameAsStrings)).toBe(false);
  });

  it('detects content changes and deletion of exported invoices', () => {
    const edited = { ...exported, items: [{ ...exported.items[0], qty: 3 }] };
    expect(buildChangeFlagPatch(exported, edited)).toEqual({
      'einvoice.changedAfterExport': true,
    });
    expect(buildChangeFlagPatch(exported, null)).toEqual({
      'einvoice.changedAfterExport': true,
    });
    expect(buildChangeFlagPatch(invoice, null)).toEqual({});
  });

  it('never accepts einvoice data from clients', () => {
    expect(
      stripEinvoiceFields({ id: 'x', einvoice: { exportedAt: 'a' } })
    ).toEqual({
      id: 'x',
    });
  });
});
