import { inRange } from './reportHelpers.js';

const num = (value) => Number(value || 0);

export const getItemArea = (item) => {
  const length = num(item?.length);
  const width = num(item?.width);
  return length > 0 && width > 0 ? num(item?.qty) * length * width : 0;
};

const toMovements = (docs = [], type) =>
  docs.flatMap((doc) =>
    (doc.items || [])
      .map((item, lineIndex) => ({ item, lineIndex }))
      .filter(({ item }) => item?.productId)
      .map(({ item, lineIndex }) => ({
        productId: item.productId,
        type,
        lineIndex,
        date: doc.date,
        doc,
        item,
        qty: num(item.qty),
        area: getItemArea(item),
        appliedToStock: type === 'in' && Boolean(doc.appliedToStock),
      }))
  );

const buildMovements = ({ purchases, invoices }) => [
  ...toMovements(purchases, 'in'),
  ...toMovements(invoices, 'out'),
];

const isBeforeFrom = (date, from) =>
  Boolean(from) && new Date(date) < from.toDate();

const createStats = () => ({
  appliedIn: 0,
  beforeFrom: 0,
  inQty: 0,
  outQty: 0,
  inArea: 0,
  outArea: 0,
  withArea: false,
  withoutArea: false,
});

const accumulate = (stats, movement, from, to) => {
  const isIn = movement.type === 'in';
  if (movement.appliedToStock) stats.appliedIn += movement.qty;
  if (isBeforeFrom(movement.date, from)) {
    stats.beforeFrom += isIn ? movement.qty : -movement.qty;
  }
  if (inRange(movement.date, from, to)) {
    if (isIn) {
      stats.inQty += movement.qty;
      stats.inArea += movement.area;
    } else {
      stats.outQty += movement.qty;
      stats.outArea += movement.area;
    }
  }
  if (movement.area) stats.withArea = true;
  else stats.withoutArea = true;
};

// product.openingStock already includes purchases flagged appliedToStock,
// so those are removed first and re-added by their own dates.
const summarize = (product, stats) => {
  const openingStock =
    num(product.openingStock) - stats.appliedIn + stats.beforeFrom;
  return {
    id: product.id,
    name: product.name || '',
    unit: product.unit || '',
    openingStock,
    inQty: stats.inQty,
    outQty: stats.outQty,
    inArea: stats.inArea,
    outArea: stats.outArea,
    closingStock: openingStock + stats.inQty - stats.outQty,
    hasArea: stats.withArea,
    mixedUnit: stats.withArea && stats.withoutArea,
  };
};

export const buildStockMovementRows = ({
  products = [],
  purchases = [],
  invoices = [],
  from = null,
  to = null,
}) => {
  const statsByProduct = {};
  buildMovements({ purchases, invoices }).forEach((movement) => {
    statsByProduct[movement.productId] ||= createStats();
    accumulate(statsByProduct[movement.productId], movement, from, to);
  });
  return products.map((product) =>
    summarize(product, statsByProduct[product.id] || createStats())
  );
};

const compareMovements = (left, right) => {
  const dateDiff = new Date(left.date) - new Date(right.date);
  if (dateDiff !== 0) return dateDiff;
  if (left.type !== right.type) return left.type === 'in' ? -1 : 1;
  return String(left.doc.code || '').localeCompare(
    String(right.doc.code || '')
  );
};

const toCardEntry = (movement, balance, partnerNames) => {
  const partnerId =
    movement.type === 'in' ? movement.doc.supplierId : movement.doc.customerId;
  return {
    key: `${movement.type}-${movement.doc.id}-${movement.lineIndex}`,
    sourceId: movement.doc.id,
    type: movement.type,
    date: movement.date,
    code: movement.doc.code || '',
    partnerName: partnerNames[partnerId] || '',
    qty: movement.qty,
    length: num(movement.item.length) || null,
    width: num(movement.item.width) || null,
    area: movement.area,
    balance,
  };
};

export const buildStockCard = ({
  product,
  purchases = [],
  invoices = [],
  partnerNames = {},
  from = null,
  to = null,
}) => {
  const movements = buildMovements({ purchases, invoices }).filter(
    (movement) => movement.productId === product.id
  );
  const stats = createStats();
  movements.forEach((movement) => accumulate(stats, movement, from, to));
  const summary = summarize(product, stats);

  let balance = summary.openingStock;
  const entries = movements
    .filter((movement) => inRange(movement.date, from, to))
    .sort(compareMovements)
    .map((movement) => {
      balance += movement.type === 'in' ? movement.qty : -movement.qty;
      return toCardEntry(movement, balance, partnerNames);
    });

  return { product: summary, entries };
};
