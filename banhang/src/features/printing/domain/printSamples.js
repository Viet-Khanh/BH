// Sample content for the "In thử" buttons of the printer settings.
import { buildDefaultTemplate } from '../../settings/templates/defaultInvoiceTemplate.js';
import { renderInvoiceTemplate } from '../../../utils/renderTemplate.js';
import { buildSampleInvoice } from '../../../utils/sampleInvoice.js';
import { buildLabelRow } from '../labels/buildLabelJobs.js';
import { buildReceiptHtml } from '../receipt/receiptHtml.js';

const SAMPLE_PRODUCTS = [
  {
    id: 'sample-1',
    name: 'Hàng mẫu',
    code: 'TH001',
    unit: 'cái',
    sellPriceDefault: 10000,
  },
  {
    id: 'sample-2',
    name: 'Hàng mẫu 2',
    code: 'TH002',
    unit: 'gói',
    sellPriceDefault: 5000,
  },
];

// One row of sample labels (count = labels per row).
export const buildSampleLabelRows = (print) => [
  buildLabelRow(SAMPLE_PRODUCTS[0], '', print.labelColumns),
];

// Sample sale; part paid so an amount is due (the VietQR block can be tried).
export const buildSampleReceiptData = (settings = {}) => ({
  invoice: { code: 'HD-MAU', date: new Date().toISOString(), total: 25000 },
  items: [
    { productId: 'sample-1', qty: 2, unitPrice: 10000, lineTotal: 20000 },
    { productId: 'sample-2', qty: 1, unitPrice: 5000, lineTotal: 5000 },
  ],
  products: SAMPLE_PRODUCTS,
  customer: null,
  payments: [{ amount: 20000 }],
  settings,
});

// `assets` = ready-made { qrSvg, barcodeSvg } (receipt/receiptAssets.js).
export const buildSampleReceiptHtml = (settings = {}, assets) =>
  buildReceiptHtml(buildSampleReceiptData(settings), assets);

// A5/A4 invoice template with the template editor's sample sale ("In thử A4").
export const buildSampleDocumentHtml = (settings = {}) =>
  renderInvoiceTemplate({
    template: settings.invoiceTemplateHtml || buildDefaultTemplate(),
    invoice: buildSampleInvoice(SAMPLE_PRODUCTS[0], { dimensions: false }),
    customer: null,
    payments: [],
    products: SAMPLE_PRODUCTS,
    settings,
  });
