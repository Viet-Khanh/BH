import { describe, expect, it } from 'vitest';
import { mapLine } from '../domain/lineMapper.js';
import { resolvePaymentMethod } from '../domain/paymentMethod.js';
import { splitTax } from '../domain/taxCalculator.js';
import { normalizeVatRate, vatRateToNumber } from '../domain/vatRates.js';

describe('vat rates', () => {
  it('normalizes accepted rates and flags invalid ones', () => {
    expect(normalizeVatRate('8%')).toBe('8');
    expect(normalizeVatRate(10)).toBe('10');
    expect(normalizeVatRate('kct')).toBe('KCT');
    expect(normalizeVatRate('')).toBeNull();
    expect(normalizeVatRate('7')).toBeUndefined();
    expect(vatRateToNumber('8')).toBe(0.08);
    expect(vatRateToNumber('KCT')).toBe(0);
  });
});

describe('splitTax', () => {
  it('splits VAT-inclusive amounts so the total stays unchanged', () => {
    expect(
      splitTax({ amount: 108000, rate: '8', pricesIncludeVat: true })
    ).toEqual({ beforeTax: 100000, tax: 8000, total: 108000 });
    expect(
      splitTax({ amount: 10001, rate: '8', pricesIncludeVat: true })
    ).toEqual({ beforeTax: 9260, tax: 741, total: 10001 });
  });

  it('adds VAT on top of exclusive amounts', () => {
    expect(
      splitTax({ amount: 100000, rate: '10', pricesIncludeVat: false })
    ).toEqual({ beforeTax: 100000, tax: 10000, total: 110000 });
  });

  it('has no tax for exempt rates', () => {
    expect(
      splitTax({ amount: 5000, rate: 'KCT', pricesIncludeVat: true })
    ).toEqual({ beforeTax: 5000, tax: 0, total: 5000 });
  });
});

describe('mapLine', () => {
  const product = { code: 'K8', name: 'Kính 8ly', unit: 'tấm' };

  it('keeps plain lines as they are', () => {
    const line = mapLine(
      { qty: 2, unitPrice: 5000, lineTotal: 10000, lineNote: 'giao sau' },
      product,
      1
    );
    expect(line).toEqual({
      index: 1,
      code: 'K8',
      name: 'Kính 8ly',
      unit: 'tấm',
      quantity: 2,
      unitPrice: 5000,
      amount: 10000,
      note: 'giao sau',
    });
  });

  it('converts length × width lines to measured square metres', () => {
    const line = mapLine(
      { qty: 3, length: 1.2, width: 2.4, unitPrice: 100000, lineTotal: 864000 },
      product,
      2
    );
    expect(line).toMatchObject({
      quantity: 8.64,
      unit: 'm2',
      unitPrice: 100000,
      amount: 864000,
      name: 'Kính 8ly (3 tấm, 1,2×2,4)',
    });
  });
});

describe('resolvePaymentMethod', () => {
  it('maps payments to TM / CK / TM/CK', () => {
    expect(resolvePaymentMethod([{ method: 'cash', amount: 1 }])).toBe('TM');
    expect(resolvePaymentMethod([{ method: 'bank', amount: 1 }])).toBe('CK');
    expect(
      resolvePaymentMethod([
        { method: 'cash', amount: 1 },
        { method: 'bank', amount: 2 },
      ])
    ).toBe('TM/CK');
    expect(resolvePaymentMethod([])).toBe('TM/CK');
    expect(resolvePaymentMethod([{ method: 'bank', amount: 0 }])).toBe('TM/CK');
  });
});

describe('mapLine with a packaging unit', () => {
  it('uses the line unit so quantity × price = amount', () => {
    expect(
      mapLine(
        {
          qty: 2,
          unitName: 'thùng',
          factor: 24,
          unitPrice: 220000,
          lineTotal: 440000,
        },
        { name: 'Coca', unit: 'lon', code: 'C1' }
      )
    ).toMatchObject({
      unit: 'thùng',
      quantity: 2,
      unitPrice: 220000,
      amount: 440000,
    });
  });
});
