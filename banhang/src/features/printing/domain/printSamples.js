// Sample content for the "In thử" buttons of the printer settings.
import { buildLabelRow } from '../labels/buildLabelJobs.js';
import { buildReceipt58Html } from '../receipt58.js';

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

export const buildSampleReceiptHtml = (settings = {}) =>
  buildReceipt58Html({
    invoice: { code: 'HD-MAU', date: new Date().toISOString(), total: 25000 },
    items: [
      { productId: 'sample-1', qty: 2, unitPrice: 10000, lineTotal: 20000 },
      { productId: 'sample-2', qty: 1, unitPrice: 5000, lineTotal: 5000 },
    ],
    products: SAMPLE_PRODUCTS,
    customer: null,
    payments: [{ amount: 50000 }],
    settings,
  });
