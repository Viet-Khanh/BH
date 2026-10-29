import { describe, expect, it } from 'vitest';
import {
  buildPurchaseSlipHtml,
  buildSavedPurchaseSlip,
} from '../purchaseSlipHtml.js';

const draft = {
  draftCode: 'PN-DRAFT',
  date: '2026-10-01T00:00:00.000Z',
  note: 'draft note',
  totals: 100,
  items: [{ productId: 'p0', qty: 1, unitCost: 100 }],
};

describe('buildSavedPurchaseSlip', () => {
  it('uses the saved purchase', () => {
    const purchase = {
      code: 'PN-001',
      date: '2026-10-02T00:00:00.000Z',
      note: '',
      total: 300,
      items: [{ productId: 'p1', qty: 3, unitCost: 100 }],
    };
    expect(
      buildSavedPurchaseSlip({ purchase, draft, supplierDebt: 50 })
    ).toEqual({
      code: 'PN-001',
      date: '2026-10-02T00:00:00.000Z',
      note: '',
      total: 300,
      supplierDebt: 50,
      items: purchase.items,
    });
  });

  it('falls back to the screen values it was saved from', () => {
    expect(
      buildSavedPurchaseSlip({ purchase: { id: 'x' }, draft, supplierDebt: 0 })
    ).toEqual({
      code: 'PN-DRAFT',
      date: draft.date,
      note: 'draft note',
      total: 100,
      supplierDebt: 0,
      items: draft.items,
    });
  });
});

describe('buildPurchaseSlipHtml', () => {
  it('is empty until settings are loaded', () => {
    expect(buildPurchaseSlipHtml({ slip: {}, settings: null })).toBe('');
  });

  it('renders the slip on the invoice template', () => {
    const html = buildPurchaseSlipHtml({
      slip: buildSavedPurchaseSlip({ purchase: {}, draft, supplierDebt: 0 }),
      supplier: { name: 'NCC An' },
      payments: [{ amount: 40 }],
      products: [{ id: 'p0', name: 'Kính 5 ly' }],
      settings: {
        invoiceTemplateHtml:
          '<p>{{invoice.code}}|{{customer.name}}|{{paid}}</p>{{items}}',
      },
    });
    expect(html).toContain('PN-DRAFT|NCC An|40');
  });
});
