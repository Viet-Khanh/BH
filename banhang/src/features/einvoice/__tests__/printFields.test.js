import { describe, expect, it } from 'vitest';
import { buildEinvoicePrintFields } from '../domain/printFields.js';

describe('buildEinvoicePrintFields', () => {
  it('prints nothing before the invoice number is known', () => {
    const fields = buildEinvoicePrintFields({ einvoice: { lookupCode: 'X' } });
    expect(fields['{{einvoice.block}}']).toBe('');
  });

  it('prints number, series, lookup page and code (escaped)', () => {
    const fields = buildEinvoicePrintFields(
      {
        einvoice: { number: '123', series: '1C26TAA', lookupCode: 'AB<1>' },
      },
      { einvoiceLookupUrl: 'https://tracuu.vn' }
    );
    expect(fields['{{einvoice.block}}']).toBe(
      '<div class="einvoice-info">HĐĐT số 123 (ký hiệu 1C26TAA) · Tra cứu tại https://tracuu.vn · Mã tra cứu: AB&lt;1&gt;</div>'
    );
    expect(fields['{{einvoice.number}}']).toBe('123');
  });
});
