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

export const makePurchase = ({ edition, master, random, stock }) => {
  const [minQty, maxQty] = edition.activity.purchaseQty;
  const products = pickDistinct(random, master.products, random.int(3, 5));
  const items = products.map((product) => {
    const qty = random.int(minQty, maxQty);
    stock.add(product.id, qty);
    const unitCost = roundPrice(product.avgCost * (0.95 + random.next() * 0.1));
    return { productId: product.id, qty, unitCost };
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
    const wanted = random.int(1, edition.activity.maxQty);
    const qty = Math.min(stock.available(product.id), wanted);
    stock.take(product.id, qty);
    const wholesale = profile !== 'walkin' && random.chance(0.5);
    return {
      productId: product.id,
      qty,
      priceType: wholesale ? 'wholesale' : 'retail',
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
