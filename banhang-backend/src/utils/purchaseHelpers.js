export const buildOldDebtByPurchase = (
  purchases = [],
  paymentsByPurchase = {}
) => {
  const sorted = [...purchases].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const supplierDebt = {};
  const map = {};
  sorted.forEach((purchase) => {
    const paid = paymentsByPurchase[purchase.id] || 0;
    const total = Number(purchase.total || 0);
    map[purchase.id] = supplierDebt[purchase.supplierId] || 0;
    supplierDebt[purchase.supplierId] =
      (supplierDebt[purchase.supplierId] || 0) + total - paid;
  });
  return map;
};

export const buildByIdMap = (items = []) =>
  items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

export const getLineTotal = ({ qty, unitCost, length, width }) => {
  let total = Number(qty || 0) * Number(unitCost || 0);
  const lengthValue = Number(length || 0);
  const widthValue = Number(width || 0);
  if (lengthValue > 0 && widthValue > 0) {
    total *= lengthValue * widthValue;
  }
  return total;
};

export const getPurchaseAmount = (purchase = {}) => {
  if (purchase.total !== undefined && purchase.total !== null) {
    return Number(purchase.total || 0);
  }
  return (purchase.items || []).reduce((sum, item) => {
    const lineTotalValue =
      item.lineTotal ??
      getLineTotal({
        qty: item.qty,
        unitCost: item.unitCost,
        length: item.length,
        width: item.width,
      });
    return sum + Number(lineTotalValue || 0);
  }, 0);
};

export const buildPurchaseFinancials = (
  purchase,
  oldDebtByPurchase = {},
  paymentsByPurchase = {}
) => {
  const amount = getPurchaseAmount(purchase);
  const oldDebt = Number(oldDebtByPurchase[purchase.id] || 0);
  const paid = Number(paymentsByPurchase[purchase.id] || 0);
  const totalPay = amount + oldDebt;
  const remain = totalPay - paid;
  return { amount, oldDebt, totalPay, paid, remain };
};

export const computeAvgCost = (oldQty, oldAvgCost, inQty, inCost) => {
  const totalQty = Number(oldQty) + Number(inQty);
  if (totalQty <= 0) return Number(oldAvgCost) || Number(inCost) || 0;
  const totalCost =
    Number(oldQty) * Number(oldAvgCost || 0) +
    Number(inQty) * Number(inCost || 0);
  return Math.round(totalCost / totalQty);
};

export const buildQtyMapFromPurchases = (
  purchases = [],
  productIds = new Set()
) => {
  const map = {};
  purchases.forEach((purchase) => {
    (purchase.items || []).forEach((item) => {
      if (!productIds.has(item.productId)) return;
      map[item.productId] = (map[item.productId] || 0) + Number(item.qty || 0);
    });
  });
  return map;
};

export const buildQtyMapFromInvoices = (
  invoices = [],
  productIds = new Set()
) => {
  const map = {};
  invoices.forEach((invoice) => {
    (invoice.items || []).forEach((item) => {
      if (!productIds.has(item.productId)) return;
      map[item.productId] = (map[item.productId] || 0) + Number(item.qty || 0);
    });
  });
  return map;
};

export const sanitizePurchaseItems = (items = []) =>
  items.map((item) => {
    const qty = Number(item.qty || 0);
    const unitCost = Number(item.unitCost || 0);
    return {
      productId: item.productId,
      qty,
      unitCost,
      lineNote: item.lineNote || '',
      length: item.length ?? null,
      width: item.width ?? null,
      lineTotal: getLineTotal({
        qty,
        unitCost,
        length: item.length,
        width: item.width,
      }),
    };
  });

export const findInvalidPurchaseItem = (items = []) =>
  items.find((item) => !item.productId);

export const buildQtyMapFromItems = (items = []) =>
  items.reduce((acc, item) => {
    if (!item?.productId) return acc;
    acc[item.productId] = (acc[item.productId] || 0) + Number(item.qty || 0);
    return acc;
  }, {});
