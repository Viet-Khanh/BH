import { describe, expect, it } from 'vitest';
import { build, invoice } from './receiptFixture.js';

describe('buildReceiptHtml', () => {
  it('prints shop, code, date and a full document for 58 mm paper', () => {
    const html = build();
    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain('Tạp hoá Minh An');
    expect(html).toContain('0901 234 567');
    expect(html).toContain('12 Lê Lợi');
    expect(html).toContain('HD0001');
    expect(html).toContain('29/10/2026 08:05');
    expect(html).toContain('width: 48mm');
    expect(html).toContain('Cảm ơn quý khách!');
  });

  it('prints each line with its unit, price and amount', () => {
    const html = build();
    expect(html).toContain('Bia Hà Nội');
    expect(html).toContain('2 thùng × 220.000');
    expect(html).toContain('440.000');
    expect(html).toContain('3 gói × 5.000');
    expect(html).toContain('15.000');
  });

  it('prints total, paid and change when paid more than total', () => {
    const html = build();
    expect(html).toContain('455.000');
    expect(html).toContain('500.000');
    expect(html).toContain('Tiền thối');
    expect(html).toContain('45.000');
    expect(html).not.toContain('Còn nợ');
  });

  it('prints the debt when paid less than total', () => {
    const html = build({ payments: [{ amount: 400000 }, { amount: 5000 }] });
    expect(html).toContain('405.000');
    expect(html).toContain('Còn nợ');
    expect(html).toContain('50.000');
    expect(html).not.toContain('Tiền thối');
  });

  it('prints neither change nor debt when paid exactly', () => {
    const html = build({ payments: [{ amount: 455000 }] });
    expect(html).not.toContain('Tiền thối');
    expect(html).not.toContain('Còn nợ');
  });

  it('prints old debt and the grand total; nothing owed when fully paid', () => {
    const html = build({
      invoice: { ...invoice, customerDebt: 100000 },
      payments: [{ amount: 555000 }],
    });
    expect(html).toContain('Nợ cũ');
    expect(html).toContain('100.000');
    expect(html).toContain('Tổng thanh toán');
    expect(html).toContain('555.000');
    expect(html).not.toContain('Còn nợ');
    expect(html).not.toContain('Tiền thối');
  });

  it('prints the remaining debt when underpaid with old debt', () => {
    const html = build({
      invoice: { ...invoice, customerDebt: 100000 },
      payments: [{ amount: 500000 }],
    });
    expect(html).toContain('Còn nợ');
    expect(html).toContain('55.000');
    expect(html).not.toContain('Tiền thối');
  });

  it('prints change when overpaid with old debt', () => {
    const html = build({
      invoice: { ...invoice, customerDebt: 100000 },
      payments: [{ amount: 600000 }],
    });
    expect(html).toContain('Tiền thối');
    expect(html).toContain('45.000');
    expect(html).not.toContain('Còn nợ');
  });

  it('hides the walk-in customer and shows a named one', () => {
    expect(build()).not.toContain('Khách lẻ');
    expect(build({ customer: null })).not.toContain('Khách hàng');
    const html = build({ customer: { name: 'Chị Lan', phone: '0988' } });
    expect(html).toContain('Chị Lan');
  });

  it('prints the note when present', () => {
    expect(build()).not.toContain('Ghi chú');
    const html = build({ invoice: { ...invoice, note: 'Giao chiều' } });
    expect(html).toContain('Giao chiều');
  });

  it('escapes HTML', () => {
    const html = build({
      customer: { name: '<b>An</b>' },
      invoice: { ...invoice, note: '<script>x</script>' },
    });
    expect(html).toContain('Mì &lt;Hảo Hảo&gt;');
    expect(html).toContain('&lt;b&gt;An&lt;/b&gt;');
    expect(html).not.toContain('<script>x');
  });
});
