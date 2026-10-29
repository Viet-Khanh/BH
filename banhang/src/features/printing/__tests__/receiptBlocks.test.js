import { describe, expect, it } from 'vitest';
import { RECEIPT_BLOCKS } from '../receipt/blocks/index.js';
import { buildReceiptContext } from '../receipt/receiptContext.js';
import { setItemsStyle } from '../receipt/receiptLayout.js';
import { items, products, settings } from './receiptFixture.js';

const invoice = { code: 'HD0001', date: '2026-10-29T08:05:00', total: 455000 };

const context = (overrides = {}, assets = {}) =>
  buildReceiptContext(
    {
      invoice,
      items,
      products,
      customer: null,
      payments: [{ amount: 400000 }],
      settings,
      ...overrides,
    },
    assets
  );

const render = (key, ctx = context()) => RECEIPT_BLOCKS[key].render(ctx);

describe('buildReceiptContext', () => {
  it('collects paper, layout, amounts and assets once', () => {
    const ctx = context(
      { settings: { ...settings, receiptPaper: '80mm' } },
      { qrSvg: '<svg/>' }
    );
    expect(ctx.paper.printableMm).toBe(72);
    expect(ctx.layout.blocks).toHaveLength(11);
    expect(ctx.amounts).toEqual({
      total: 455000,
      oldDebt: 0,
      paid: 400000,
      due: 55000,
    });
    expect(ctx.qrSvg).toBe('<svg/>');
    expect(ctx.barcodeSvg).toBe('');
    expect(ctx.logo).toBe('');
  });
});

describe('receipt blocks', () => {
  it('has a renderer for every layout block', () => {
    context().layout.blocks.forEach(({ key }) =>
      expect(typeof RECEIPT_BLOCKS[key]?.render).toBe('function')
    );
  });

  it('logo: only with a stored image, never wider than the paper', () => {
    expect(render('logo')).toBe('');
    const logo = 'data:image/png;base64,AAAA';
    const html = render(
      'logo',
      context({ settings: { ...settings, receiptLogo: logo } })
    );
    expect(html).toContain(`<img src="${logo}"`);
    expect(html).toContain('max-width: 100%');
  });

  it('shop, title, meta and footer', () => {
    expect(render('shop')).toContain('Tạp hoá Minh An');
    expect(render('shop', context({ settings: {} }))).toBe('');
    expect(render('title')).toContain('HOÁ ĐƠN BÁN HÀNG');
    expect(render('meta')).toContain('HD0001');
    expect(render('meta')).toContain('29/10/2026 08:05');
    expect(render('footer')).toContain('Cảm ơn quý khách!');
  });

  it('customer: hidden for walk-in, name and phone otherwise', () => {
    expect(render('customer')).toBe('');
    expect(
      render('customer', context({ customer: { name: 'Khách lẻ' } }))
    ).toBe('');
    const html = render(
      'customer',
      context({ customer: { name: 'Chị Lan', phone: '0988' } })
    );
    expect(html).toContain('Chị Lan');
    expect(html).toContain('0988');
  });

  it('items: two lines by default, one line in compact style', () => {
    const twoLine = render('items');
    expect(twoLine).toContain('2 thùng × 220.000');
    expect(twoLine).toContain('class="name"');
    const ctx = context();
    const compact = render('items', {
      ...ctx,
      layout: setItemsStyle(ctx.layout, 'compact'),
    });
    expect(compact).toContain('Bia Hà Nội');
    expect(compact).toContain('2 thùng × 220.000');
    expect(compact).toContain('440.000');
    expect(compact).not.toContain('class="name"');
  });

  it('totals: debt or change from the amounts', () => {
    const html = render('totals');
    expect(html).toContain('TỔNG CỘNG');
    expect(html).toContain('Còn nợ');
    expect(html).toContain('55.000');
  });

  it('note: from printNote or note', () => {
    expect(render('note')).toBe('');
    expect(
      render('note', context({ invoice: { ...invoice, printNote: 'Giao' } }))
    ).toContain('Giao');
  });

  it('qr: the ready-made SVG with bank, account and amount', () => {
    expect(render('qr')).toBe('');
    const html = render(
      'qr',
      context(
        {
          settings: {
            ...settings,
            bankBin: '970436',
            bankAccountNo: '0123456789',
            bankAccountName: 'NGUYEN VAN A',
          },
        },
        { qrSvg: '<svg id="qr"></svg>' }
      )
    );
    expect(html).toContain('<svg id="qr"></svg>');
    expect(html).toContain('Vietcombank');
    expect(html).toContain('0123456789');
    expect(html).toContain('NGUYEN VAN A');
    expect(html).toContain('55.000');
  });

  it('barcode: the ready-made SVG and the code', () => {
    expect(render('barcode')).toBe('');
    const html = render(
      'barcode',
      context({}, { barcodeSvg: '<svg id="bc"></svg>' })
    );
    expect(html).toContain('<svg id="bc"></svg>');
    expect(html).toContain('HD0001');
  });
});
