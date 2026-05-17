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
});
