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
  expect(buildSampleInvoice(undefined, { dimensions: false }).items).toEqual(
    []
  );
});
