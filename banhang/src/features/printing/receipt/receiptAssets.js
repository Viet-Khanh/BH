// Async glue before printing a roll receipt: QR and barcode SVG strings for the
// pure builder (buildReceiptHtml). A failing asset is left out, never blocks printing.
import { computeBarcodeLayout, DOTS_PER_MM } from '../labels/barcodeLayout.js';
import { loadBarcodeRenderer } from '../labels/barcodeSvg.js';
import { buildReceiptContext } from './receiptContext.js';
import { isBlockOn } from './receiptLayout.js';
import { buildVietQrPayload } from './vietqr.js';

const QR_MAX_MM = 40;
const QR_WIDTH_SHARE = 0.7;
const BARCODE_HEIGHT_MM = 10;

// VietQR text, or '' when the block is off, bank info is incomplete or nothing is due.
export const getReceiptQrPayload = ({ layout, settings, amounts, invoice }) => {
  if (!isBlockOn(layout, 'qr') || !(amounts.due > 0)) return '';
  return buildVietQrPayload({
    bin: settings.bankBin,
    accountNo: settings.bankAccountNo,
    amount: amounts.due,
    description: invoice.code,
  });
};

// JsBarcode symbol → standalone SVG, modules snapped to whole printer dots.
export const toBarcodeSvg = (symbol, availableMm) => {
  if (!symbol) return '';
  const { widthMm } = computeBarcodeLayout({
    totalModules: symbol.totalModules,
    availableMm,
  });
  const width = Math.round(widthMm * 10000) / 10000;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}mm" height="${BARCODE_HEIGHT_MM}mm" viewBox="${symbol.viewBox}" preserveAspectRatio="none" shape-rendering="crispEdges">${symbol.inner}</svg>`;
};

const renderQr = async (payload, paper) => {
  const { renderQrSvg } = await import('./qrSvg.js');
  const sizeMm = Math.min(QR_MAX_MM, paper.printableMm * QR_WIDTH_SHARE);
  return renderQrSvg(payload, { sizeMm, dotsPerMm: DOTS_PER_MM });
};

const renderInvoiceBarcode = async (code, paper) => {
  const render = await loadBarcodeRenderer();
  return toBarcodeSvg(render(code, 'CODE128'), paper.printableMm);
};

const safely = (task) => task().catch(() => '');

// data = { invoice, items, products, customer, payments, settings } → { qrSvg, barcodeSvg }.
export const loadReceiptAssets = async (data) => {
  const ctx = buildReceiptContext(data);
  const payload = getReceiptQrPayload(ctx);
  const code = ctx.invoice.code;
  const [qrSvg, barcodeSvg] = await Promise.all([
    payload ? safely(() => renderQr(payload, ctx.paper)) : '',
    isBlockOn(ctx.layout, 'barcode') && code
      ? safely(() => renderInvoiceBarcode(String(code), ctx.paper))
      : '',
  ]);
  return { qrSvg, barcodeSvg };
};
