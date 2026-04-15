export const buildPurchaseItems = (purchase) =>
  (purchase?.items || []).map((item) => ({
    ...item,
    lineNote: item.lineNote || '',
  }));

export const getPurchaseLineTotal = (item = {}) => {
  const qty = Number(item.qty || 0);
  const unitCost = Number(item.unitCost || 0);
  let lineTotal = qty * unitCost;
  const length = Number(item.length || 0);
  const width = Number(item.width || 0);
  if (length > 0 && width > 0) {
    lineTotal *= length * width;
  }
  return lineTotal;
};

export const mergeProducts = (current = [], incoming = []) => {
  const productMap = new Map();

  incoming.forEach((item) => {
    if (item?.id) productMap.set(item.id, item);
  });
  current.forEach((item) => {
    if (item?.id && !productMap.has(item.id)) productMap.set(item.id, item);
  });

  return Array.from(productMap.values());
};

export const normalizePurchaseItem = (item) => ({
  ...item,
  qty: Number(item.qty || 0),
  unitCost: Number(item.unitCost || 0),
  length: Number(item.length || 0) > 0 ? Number(item.length) : null,
  width: Number(item.width || 0) > 0 ? Number(item.width) : null,
  lineNote: item.lineNote || '',
  lineTotal: getPurchaseLineTotal(item),
});

export const normalizePurchaseItems = (items = []) =>
  items.map(normalizePurchaseItem);

export const buildPurchasePayload = ({
  id,
  code,
  supplierId,
  date,
  note,
  items,
}) => ({
  ...(id ? { id } : {}),
  code,
  supplierId,
  date,
  note,
  items,
  total: items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0),
});

export const buildPurchasePreviewInvoice = ({
  code,
  date,
  note,
  total,
  supplierDebt,
  items,
}) => ({
  code,
  date,
  note,
  total,
  customerDebt: supplierDebt,
  items: (items || []).map((item) => ({
    ...item,
    unitPrice: Number(item.unitCost || 0),
    lineNote: item.lineNote || '',
  })),
});
