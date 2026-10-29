const PRICE_STEP = 100;
const MONEY_STEP = 1000;
const PAID_RATIOS = {
  walkin: [1],
  regular: [1, 1, 0.5],
  debtor: [0, 0.5, 1],
};
const METHODS = ['cash', 'cash', 'bank'];

export const roundPrice = (value) =>
  Math.max(PRICE_STEP, Math.round(value / PRICE_STEP) * PRICE_STEP);

export const roundMoney = (value) =>
  Math.round(value / MONEY_STEP) * MONEY_STEP;

// Full payment stays exact; partial payments round to 1.000đ and never exceed the total.
export const paidAmount = (total, ratio) =>
  ratio >= 1 ? total : Math.min(total, roundMoney(total * ratio));

const pickDistinct = (random, list, count) => {
  const pool = [...list];
  const picked = [];
  while (pool.length && picked.length < count) {
    picked.push(pool.splice(random.int(0, pool.length - 1), 1)[0]);
  }
  return picked;
};

const pickUnit = (random, product) =>
  product.units?.length && random.chance(0.4)
    ? random.pick(product.units)
    : null;

export const makePurchase = ({ edition, master, random, stock }) => {
  const [minQty, maxQty] = edition.activity.purchaseQty;
  const products = pickDistinct(random, master.products, random.int(3, 5));
  const items = products.map((product) => {
    const unit = pickUnit(random, product);
    const qty = unit ? random.int(1, 2) : random.int(minQty, maxQty);
    const factor = unit ? unit.factor : 1;
    stock.add(product.id, qty * factor);
    const unitCost = roundPrice(
      product.avgCost * factor * (0.95 + random.next() * 0.1)
    );
    return {
      productId: product.id,
      qty,
      unitCost,
      ...(unit ? { unitName: unit.name, factor } : {}),
    };
  });
  return {
    kind: 'purchase',
    supplierId: random.pick(master.suppliers).id,
    items,
    paidRatio: random.pick([1, 1, 0.5]),
    method: random.pick(METHODS),
  };
};

export const makeInvoice = ({ edition, master, random, stock }) => {
  const candidates = stock.inStock();
  if (!candidates.length) return null;
  const walkIn =
    !master.accountCustomerIds.length ||
    random.chance(edition.activity.walkInRatio);
  const customerId = walkIn
    ? master.walkInCustomerId
    : random.pick(master.accountCustomerIds);
  const profile = master.profileById[customerId];
  const products = pickDistinct(random, candidates, random.int(1, 4));
  const items = products.map((product) => {
    const unit = pickUnit(random, product);
    const factor =
      unit && stock.available(product.id) >= unit.factor ? unit.factor : 1;
    const wanted = factor > 1 ? 1 : random.int(1, edition.activity.maxQty);
    const qty = Math.min(
      Math.floor(stock.available(product.id) / factor),
      wanted
    );
    stock.take(product.id, qty * factor);
    const wholesale = profile !== 'walkin' && random.chance(0.5);
    return {
      productId: product.id,
      qty,
      priceType: wholesale ? 'wholesale' : 'retail',
      ...(factor > 1 ? { unitName: unit.name, factor } : {}),
    };
  });
  return {
    kind: 'invoice',
    customerId,
    items,
    paidRatio: random.pick(PAID_RATIOS[profile]),
    method: random.pick(METHODS),
  };
};

export const makeDebtReceipt = ({ random }, customerId) => ({
  kind: 'debtReceipt',
  customerId,
  ratio: random.pick([0.3, 0.5, 1]),
  method: random.pick(METHODS),
});

export const makeExpense = ({ edition, random }) => {
  const [category, note, min, max] = random.pick(edition.expenses);
  return {
    kind: 'expense',
    category,
    note,
    amount: roundMoney(random.int(min, max)),
  };
};
