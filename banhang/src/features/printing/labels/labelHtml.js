import { escapeHtml } from '../../../utils/htmlEscape.js';
import { formatMoney } from '../../../utils/moneyFormat.js';
import { buildPageSizeCss } from '../../../utils/printPageSize.js';
import { getLabelRowSize } from '../domain/printSettings.js';

// Approximate heights (mm) of the text lines, used to size the barcode.
const PADDING_MM = 1;
const SHOP_MM = 2.6;
const NAME_MM = 5;
const PRICE_MM = 3.8;
const CODE_MM = 2.6;
const MIN_BARCODE_MM = 4;

const mm = (value) => `${Math.round(value * 100) / 100}mm`;

const STYLE = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: #fff; color: #000; }
body { font-family: Arial, Helvetica, sans-serif; }
.page { position: relative; overflow: hidden; page-break-after: always; break-after: page; }
.page:last-child { page-break-after: auto; break-after: auto; }
.label { position: absolute; overflow: hidden; display: flex; flex-direction: column; align-items: center; text-align: center; }
.shop { font-size: 7px; line-height: 1.2; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.name { font-size: 8px; line-height: 1.15; font-weight: bold; width: 100%; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; word-break: break-word; }
.price { font-size: 10px; line-height: 1.2; font-weight: bold; white-space: nowrap; }
.barcode { width: 100%; display: flex; justify-content: center; }
.barcode svg { width: 100%; height: 100%; }
.code { font-size: 7px; line-height: 1.2; white-space: nowrap; }
`;

const getBarcodeSize = (print) => {
  const used =
    2 * PADDING_MM +
    (print.labelShowShopName ? SHOP_MM : 0) +
    NAME_MM +
    (print.labelShowPrice ? PRICE_MM : 0) +
    CODE_MM;
  return {
    widthMm: Math.max(1, print.labelWidthMm - 2 * PADDING_MM),
    heightMm: Math.max(MIN_BARCODE_MM, print.labelHeightMm - used),
  };
};

const renderContent = ({ row, print, shopName, svg, barcodeSize }) => {
  const parts = [];
  if (print.labelShowShopName && shopName) {
    parts.push(`<div class="shop">${escapeHtml(shopName)}</div>`);
  }
  parts.push(`<div class="name">${escapeHtml(row.name)}</div>`);
  if (print.labelShowPrice) {
    const unit = row.unitLabel ? `/${escapeHtml(row.unitLabel)}` : '';
    parts.push(
      `<div class="price">${escapeHtml(formatMoney(row.price))}${unit}</div>`
    );
  }
  if (row.barcode) {
    if (svg) {
      parts.push(
        `<div class="barcode" style="height: ${mm(barcodeSize.heightMm)}">${svg}</div>`
      );
    }
    parts.push(`<div class="code">${escapeHtml(row.barcode)}</div>`);
  }
  return parts.join('');
};

const renderLabel = (label, column, print) => {
  const left =
    print.labelOffsetXMm + column * (print.labelWidthMm + print.labelGapMm);
  const style = [
    `left: ${mm(left)}`,
    `top: ${mm(print.labelOffsetYMm)}`,
    `width: ${mm(print.labelWidthMm)}`,
    `height: ${mm(print.labelHeightMm)}`,
    `padding: ${mm(PADDING_MM)}`,
  ].join('; ');
  return `<div class="label" style="${style}">${label}</div>`;
};

const chunk = (list, size) => {
  const pages = [];
  for (let index = 0; index < list.length; index += size) {
    pages.push(list.slice(index, index + size));
  }
  return pages;
};

// Label sheet HTML: one page per row of `labelColumns` labels, sizes in mm.
export const buildLabelPagesHtml = ({
  rows = [],
  print,
  shopName = '',
  renderBarcode,
}) => {
  const barcodeSize = getBarcodeSize(print);
  const labels = rows.flatMap((row) => {
    const count = Math.max(0, Math.floor(Number(row.count) || 0));
    if (!count) return [];
    const svg = row.barcode
      ? renderBarcode(row.barcode, row.barcodeFormat, barcodeSize)
      : '';
    const html = renderContent({ row, print, shopName, svg, barcodeSize });
    return Array.from({ length: count }, () => html);
  });
  const rowSize = getLabelRowSize(print);
  const pageStyle = `width: ${mm(rowSize.widthMm)}; height: ${mm(rowSize.heightMm)}`;
  const pages = chunk(labels, print.labelColumns).map(
    (page) =>
      `<div class="page" style="${pageStyle}">${page
        .map((label, column) => renderLabel(label, column, print))
        .join('')}</div>`
  );
  return `<!doctype html><html><head><meta charset="utf-8"><title>Tem</title><style>${buildPageSizeCss(rowSize)}${STYLE}</style></head><body>${pages.join('')}</body></html>`;
};
