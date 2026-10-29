// Roll receipt HTML: visible layout blocks in order, sized to the paper.
import { RECEIPT_BLOCKS } from './blocks/index.js';
import { buildReceiptContext } from './receiptContext.js';
import { buildReceiptStyles } from './receiptStyles.js';

const SEPARATOR = '<div class="sep"></div>';

// Rendered blocks joined with a separator wherever the zone changes.
const composeBlocks = (ctx) => {
  const parts = [];
  let lastZone = null;
  ctx.layout.blocks.forEach(({ key, on }) => {
    const block = RECEIPT_BLOCKS[key];
    if (!on || !block) return;
    const html = block.render(ctx);
    if (!html) return;
    if (lastZone && lastZone !== block.zone) parts.push(SEPARATOR);
    parts.push(html);
    lastZone = block.zone;
  });
  return parts.join('');
};

// data = { invoice, items, products, customer, payments, settings };
// assets = ready-made { qrSvg, barcodeSvg } (see receiptAssets.js).
export const buildReceiptHtml = (data, assets) => {
  const ctx = buildReceiptContext(data, assets);
  return `<!doctype html>
<html lang="vi">
<head><meta charset="utf-8" /><title>Hoá đơn</title><style>${buildReceiptStyles(ctx.paper, ctx.layout)}</style></head>
<body>${composeBlocks(ctx)}</body>
</html>`;
};
