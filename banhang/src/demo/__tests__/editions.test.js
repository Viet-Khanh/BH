import { describe, expect, it } from 'vitest';
import { DEMO_EDITIONS, getDemoEdition } from '../editions/index.js';

describe.each(DEMO_EDITIONS)('edition $id', (edition) => {
  it('has complete metadata', () => {
    ['id', 'name', 'tagline', 'appTitle', 'codePrefix'].forEach((key) =>
      expect(edition[key]).toBeTruthy()
    );
    expect(edition.shop.name).toBeTruthy();
    expect(Number.isInteger(edition.seed)).toBe(true);
  });

  it('has sane products', () => {
    expect(edition.products.length).toBeGreaterThanOrEqual(25);
    const names = new Set();
    edition.products.forEach((row) => {
      const [group, name, unit, , cost, retail, wholesale, stock] = row;
      expect(row.length).toBeGreaterThanOrEqual(8);
      expect(group && name).toBeTruthy();
      expect(edition.units).toContain(unit);
      expect(cost).toBeGreaterThan(0);
      expect(wholesale).toBeGreaterThanOrEqual(cost);
      expect(retail).toBeGreaterThanOrEqual(wholesale);
      expect(stock).toBeGreaterThan(0);
      expect(names.has(name.toLowerCase())).toBe(false);
      names.add(name.toLowerCase());
    });
  });

  it('has customers, suppliers, expenses and activity knobs', () => {
    expect(edition.customers.length).toBeGreaterThanOrEqual(8);
    expect(
      edition.customers
        .filter((customer) => customer.profile === 'walkin')
        .map((customer) => customer.name)
    ).toEqual(['Khách lẻ']);
    expect(
      edition.customers.some((customer) => customer.profile === 'debtor')
    ).toBe(true);
    expect(edition.suppliers.length).toBeGreaterThanOrEqual(3);
    expect(edition.expenses.length).toBeGreaterThan(0);
    const { invoicesPerDay, maxQty, purchaseQty, walkInRatio } =
      edition.activity;
    expect(invoicesPerDay[0]).toBeLessThanOrEqual(invoicesPerDay[1]);
    expect(purchaseQty[0]).toBeLessThanOrEqual(purchaseQty[1]);
    expect(maxQty).toBeGreaterThan(0);
    expect(walkInRatio).toBeGreaterThan(0);
  });
});

it('looks editions up by id', () => {
  expect(getDemoEdition('vlxd').id).toBe('vlxd');
  expect(getDemoEdition('nope')).toBeNull();
});
