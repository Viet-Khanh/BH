import { beforeEach, describe, expect, it, vi } from 'vitest';

const printHtml = vi.hoisted(() => vi.fn());
vi.mock('../../../utils/printUtils.js', () => ({ printHtml }));

const { buildSalesPrintJob, printSalesInvoice } =
  await import('../printSalesInvoice.js');
const { DEFAULT_RECEIPT_LAYOUT, toggleBlock } =
  await import('../receipt/receiptLayout.js');

const base = {
  invoice: { code: 'HD1', date: '2026-10-29', total: 1000, items: [] },
  products: [],
  customer: null,
  payments: [{ amount: 1000 }],
  buildHtml: () => '<p>a5</p>',
};

describe('buildSalesPrintJob', () => {
  it('uses the 58 mm receipt on the receipt printer', () => {
    const job = buildSalesPrintJob({
      ...base,
      settings: {
        receiptPaper: '58mm',
        receiptPrinterName: 'XP-58',
        printCopies: 2,
      },
    });
    expect(job.html).toContain('HOÁ ĐƠN BÁN HÀNG');
    expect(job.options).toEqual({
      copies: 2,
      deviceName: 'XP-58',
      autoHeightWidthMm: 58,
    });
  });

  it('prints every roll paper at its own width', () => {
    const job = buildSalesPrintJob({
      ...base,
      settings: { receiptPaper: '80mm', receiptPrinterName: 'XP-80' },
    });
    expect(job.html).toContain('width: 72mm');
    expect(job.options).toMatchObject({
      deviceName: 'XP-80',
      autoHeightWidthMm: 80,
    });
    const custom = buildSalesPrintJob({
      ...base,
      settings: { receiptPaper: 'custom', receiptWidthMm: 76 },
    });
    expect(custom.options.autoHeightWidthMm).toBe(76);
  });

  it('puts ready-made QR and barcode SVGs into the receipt', () => {
    const layout = toggleBlock(DEFAULT_RECEIPT_LAYOUT, 'barcode', true);
    const job = buildSalesPrintJob({
      ...base,
      settings: { receiptPaper: '58mm', receiptLayout: layout },
      assets: { barcodeSvg: '<svg id="bc"></svg>' },
    });
    expect(job.html).toContain('<svg id="bc"></svg>');
  });

  it('keeps the normal template otherwise', () => {
    const job = buildSalesPrintJob({
      ...base,
      settings: { receiptPaper: 'auto' },
      copies: 1,
    });
    expect(job).toEqual({
      html: '<p>a5</p>',
      options: { copies: 1, autoPageSize: true, deviceName: '' },
    });
  });

  it('prints the template on the document printer', () => {
    const job = buildSalesPrintJob({
      ...base,
      settings: {
        receiptPaper: 'auto',
        receiptPrinterName: 'XP-58',
        documentPrinterName: 'Canon LBP',
      },
    });
    expect(job.options.deviceName).toBe('Canon LBP');
  });

  it("forces the A5/A4 template with format 'a4' on roll paper", () => {
    const settings = {
      receiptPaper: '58mm',
      receiptPrinterName: 'XP-58',
      documentPrinterName: 'Canon LBP',
      printCopies: 2,
    };
    expect(buildSalesPrintJob({ ...base, settings, format: 'a4' })).toEqual({
      html: '<p>a5</p>',
      options: { copies: 2, autoPageSize: true, deviceName: 'Canon LBP' },
    });
    const roll = buildSalesPrintJob({ ...base, settings, format: 'default' });
    expect(roll.options).toEqual({
      copies: 2,
      deviceName: 'XP-58',
      autoHeightWidthMm: 58,
    });
  });

  it('returns null when there is nothing to print', () => {
    expect(buildSalesPrintJob({ ...base, settings: null })).toBeNull();
    expect(
      buildSalesPrintJob({
        ...base,
        settings: {},
        buildHtml: () => '',
      })
    ).toBeNull();
  });
});

describe('printSalesInvoice', () => {
  beforeEach(() => printHtml.mockReset());

  it('renders the VietQR for the amount due before printing', async () => {
    await printSalesInvoice({
      ...base,
      payments: [{ amount: 400 }],
      settings: {
        receiptPaper: '58mm',
        receiptLayout: toggleBlock(DEFAULT_RECEIPT_LAYOUT, 'qr', true),
        bankBin: '970436',
        bankAccountNo: '0123456789',
      },
    });
    const [html, options] = printHtml.mock.calls[0];
    expect(html).toContain('<path d="M');
    expect(html).toContain('Vietcombank');
    expect(options.autoHeightWidthMm).toBe(58);
  });

  it('prints the normal template unchanged', async () => {
    await printSalesInvoice({ ...base, settings: { receiptPaper: 'auto' } });
    expect(printHtml).toHaveBeenCalledWith('<p>a5</p>', {
      copies: 1,
      autoPageSize: true,
      deviceName: '',
    });
  });

  it("prints format 'a4' without loading receipt assets", async () => {
    await printSalesInvoice({
      ...base,
      format: 'a4',
      settings: { receiptPaper: '80mm', documentPrinterName: 'Canon LBP' },
    });
    expect(printHtml).toHaveBeenCalledWith('<p>a5</p>', {
      copies: 1,
      autoPageSize: true,
      deviceName: 'Canon LBP',
    });
  });

  it('prints nothing without settings', async () => {
    await printSalesInvoice({ ...base, settings: null });
    expect(printHtml).not.toHaveBeenCalled();
  });
});
