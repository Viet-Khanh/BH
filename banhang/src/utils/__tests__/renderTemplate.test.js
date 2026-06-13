import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATE } from '../../features/settings/templates/defaultInvoiceTemplate.js';
import { renderInvoiceTemplate } from '../renderTemplate.js';

describe('renderInvoiceTemplate', () => {
  it('rounds invoice summary money values for printing', () => {
    const html = renderInvoiceTemplate({
      template: DEFAULT_TEMPLATE,
      invoice: {
        code: 'INV-1',
        date: '2026-05-17T00:00:00.000Z',
        total: 1258535.5,
        customerDebt: 1000.4,
        items: [],
      },
      customer: { name: 'Khách hàng' },
      payments: [{ amount: 500.4 }],
      products: [],
      settings: {},
    });

    expect(html).toContain('<span>1.258.536</span>');
    expect(html).toContain('<span>1.000</span>');
    expect(html).toContain('<span>1.259.536</span>');
    expect(html).toContain('<span>1.259.036</span>');
    expect(html).not.toContain('1.258.535,5');
  });

  it('rounds item unit price and line total for printing', () => {
    const html = renderInvoiceTemplate({
      template: DEFAULT_TEMPLATE,
      invoice: {
        code: 'INV-2',
        date: '2026-05-17T00:00:00.000Z',
        total: 57187.2,
        customerDebt: 0,
        items: [
          {
            name: 'Sản phẩm',
            qty: 1,
            unitPrice: 57187.2,
            lineTotal: 57187.2,
          },
        ],
      },
      customer: { name: 'Khách hàng' },
      payments: [],
      products: [],
      settings: {},
    });

    expect(html).toContain('57.187');
    expect(html).not.toContain('57.187,2');
  });
});
