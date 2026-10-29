import {
  getLineAmount,
  getMeasuredQty,
} from '../../../../utils/lineMeasure.js';
import { formatMeasure } from '../../../../utils/measureFormat.js';
import { formatMoney } from '../../../../utils/moneyFormat.js';
import { getItemUnitName } from '../../../../utils/productUnits.js';
import { getBlock } from '../receiptLayout.js';
import { row, text } from './html.js';

const readLine = (item, products) => {
  const product = products.find((entry) => entry.id === item.productId);
  const unit = getItemUnitName(item, product);
  const qty = formatMeasure(getMeasuredQty(item));
  return {
    name: text(product?.name || item.name || 'Sản phẩm'),
    quantity: `${qty}${unit ? ` ${text(unit)}` : ''} × ${formatMoney(item.unitPrice)}`,
    amount: formatMoney(item.lineTotal ?? getLineAmount(item)),
    note: item.lineNote
      ? `<div class="line-note">${text(item.lineNote)}</div>`
      : '',
  };
};

// Name on its own line, then "qty unit × price" and the amount.
const renderTwoLine = (line) =>
  `<div class="item"><div class="name">${line.name}</div>${line.note}${row(line.quantity, line.amount)}</div>`;

// One line: name (qty × price in small print) … amount.
const renderCompact = (line) =>
  `<div class="item">${row(`<b>${line.name}</b> <span class="small">${line.quantity}</span>`, line.amount)}${line.note}</div>`;

export const renderItems = ({ items, products, layout }) => {
  const style = getBlock(layout, 'items')?.style;
  const renderLine = style === 'compact' ? renderCompact : renderTwoLine;
  return items.map((item) => renderLine(readLine(item, products))).join('');
};
