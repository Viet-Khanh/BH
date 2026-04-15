import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import { computeStock } from '../../../utils/stock.js';
import {
  parseRange,
  parsePagination,
  buildPaymentsByPurchase,
} from '../../../utils/reportHelpers.js';
import {
  buildOldDebtByPurchase,
  buildByIdMap,
  buildPurchaseFinancials,
  sanitizePurchaseItems,
  findInvalidPurchaseItem,
  buildQtyMapFromItems,
  buildQtyMapFromPurchases,
  buildQtyMapFromInvoices,
  computeAvgCost,
} from '../../../utils/purchaseHelpers.js';
import {
  createPurchaseDoc,
  findInvoices,
  findPayments,
  findProductsByIds,
  findPurchaseById,
  findPurchases,
  findSupplierById,
  findSuppliersByIds,
  updateProductById,
  updatePurchaseDoc,
} from '../repositories/purchases.repository.js';

export const getRecentPurchases = async (query) => {
  const { from, to } = parseRange(query);
  const supplierId = String(query.supplierId || '').trim();
  const hasPagination =
    query.page !== undefined || query.pageSize !== undefined;
  const { page, pageSize } = parsePagination(query);
  const rawLimit = Number(query.limit || 200);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), 1000)
    : 200;

  const baseFilter = { isDeleted: { $ne: true } };
  if (supplierId) baseFilter.supplierId = supplierId;
  const recentFilter = { ...baseFilter };
  if (from || to) {
    recentFilter.date = {};
    if (from) recentFilter.date.$gte = from.toISOString();
    if (to) recentFilter.date.$lte = to.toISOString();
  }

  const [allFilteredPurchases, purchasesForDebt] = await Promise.all([
    findPurchases(recentFilter, {
      sort: { date: -1 },
      ...(hasPagination ? {} : { limit }),
    }),
    findPurchases(baseFilter),
  ]);
  const purchaseIdsForDebt = purchasesForDebt.map((purchase) => purchase.id);
  const debtPayments = purchaseIdsForDebt.length
    ? await findPayments({
        purchaseId: { $in: purchaseIdsForDebt },
        isDeleted: { $ne: true },
      })
    : [];
  const paymentsByPurchase = buildPaymentsByPurchase(debtPayments);
  const oldDebtByPurchase = buildOldDebtByPurchase(
    purchasesForDebt,
    paymentsByPurchase
  );

  const summary = allFilteredPurchases.reduce(
    (acc, purchase) => {
      const amount = Number(purchase.total || 0);
      const paid = Number(paymentsByPurchase[purchase.id] || 0);
      const oldDebt = Number(oldDebtByPurchase[purchase.id] || 0);
      const totalPay = amount + oldDebt;
      const remain = totalPay - paid;
      return {
        amount: acc.amount + amount,
        paid: acc.paid + paid,
        remain: acc.remain + remain,
        totalPay: acc.totalPay + totalPay,
      };
    },
    { amount: 0, paid: 0, remain: 0, totalPay: 0 }
  );

  const total = allFilteredPurchases.length;
  const totalPages = hasPagination
    ? Math.max(1, Math.ceil(total / pageSize))
    : 1;
  const currentPage = hasPagination ? Math.min(page, totalPages) : 1;
  const start = (currentPage - 1) * pageSize;
  const purchases = hasPagination
    ? allFilteredPurchases.slice(start, start + pageSize)
    : allFilteredPurchases;
  const effectivePageSize = hasPagination
    ? pageSize
    : purchases.length || limit;

  const supplierIds = [
    ...new Set(
      purchases.map((purchase) => purchase.supplierId).filter(Boolean)
    ),
  ];
  const suppliers = supplierIds.length
    ? await findSuppliersByIds(supplierIds)
    : [];
  const supplierMap = buildByIdMap(suppliers);

  const productIds = new Set();
  purchases.forEach((purchase) => {
    (purchase.items || []).forEach((item) => {
      if (item.productId) productIds.add(item.productId);
    });
  });
  const products = productIds.size
    ? await findProductsByIds([...productIds])
    : [];
  const productMap = buildByIdMap(products);

  const exportRows = purchases.flatMap((purchase) => {
    const supplier = supplierMap[purchase.supplierId];
    return (purchase.items || []).map((item) => {
      const product = productMap[item.productId] || {};
      return {
        Ma_phieu: purchase.code,
        Ngay: dayjs(purchase.date).format('DD/MM/YYYY'),
        Nha_cung_cap: supplier?.name || '',
        San_pham: product.name || '',
        DVT: product.unit || '',
        Quy_cach: product.spec || '',
        So_luong: item.qty,
        Don_gia: item.unitCost,
        Thanh_tien: item.lineTotal,
        Ghi_chu_hang: item.lineNote || '',
      };
    });
  });

  const rows = purchases.map((purchase) => ({
    id: purchase.id,
    code: purchase.code,
    date: purchase.date,
    supplierId: purchase.supplierId,
    staff: purchase.staff || '',
    itemsCount: (purchase.items || []).length,
    qtySum: (purchase.items || []).reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0
    ),
    amount: Number(purchase.total || 0),
    total: Number(purchase.total || 0),
    paid: Number(paymentsByPurchase[purchase.id] || 0),
    oldDebt: Number(oldDebtByPurchase[purchase.id] || 0),
    totalPay:
      Number(purchase.total || 0) + Number(oldDebtByPurchase[purchase.id] || 0),
    remain:
      Number(purchase.total || 0) +
      Number(oldDebtByPurchase[purchase.id] || 0) -
      Number(paymentsByPurchase[purchase.id] || 0),
    supplierName: supplierMap[purchase.supplierId]?.name || '',
    phone: supplierMap[purchase.supplierId]?.phone || '',
    address: supplierMap[purchase.supplierId]?.address || '',
    note: purchase.note,
  }));

  return {
    rows,
    exportRows,
    summary,
    pagination: {
      total,
      page: currentPage,
      pageSize: effectivePageSize,
      totalPages,
    },
  };
};

export const getPurchaseDetail = async (id) => {
  const purchase = await findPurchaseById(id);
  if (!purchase) throw new Error('Purchase not found');

  const [supplier, payments, purchases, invoices] = await Promise.all([
    findSupplierById(purchase.supplierId),
    findPayments({ purchaseId: purchase.id, isDeleted: { $ne: true } }),
    findPurchases({ isDeleted: { $ne: true } }),
    findInvoices({ isDeleted: { $ne: true } }),
  ]);

  const productIds = new Set();
  (purchase.items || []).forEach((item) => {
    if (item.productId) productIds.add(item.productId);
  });
  const baseProducts = productIds.size
    ? await findProductsByIds([...productIds])
    : [];
  const products = baseProducts.map((product) => ({
    ...product,
    stock: computeStock(product.id, purchases, invoices, baseProducts),
  }));

  const supplierPurchases = purchases.filter(
    (item) => item.supplierId === purchase.supplierId
  );
  const supplierPurchaseIds = supplierPurchases.map((item) => item.id);
  const supplierPayments = supplierPurchaseIds.length
    ? await findPayments({
        purchaseId: { $in: supplierPurchaseIds },
        isDeleted: { $ne: true },
      })
    : [];
  const paymentsByPurchase = buildPaymentsByPurchase(supplierPayments);
  const oldDebtByPurchase = buildOldDebtByPurchase(
    supplierPurchases,
    paymentsByPurchase
  );
  const financials = buildPurchaseFinancials(
    purchase,
    oldDebtByPurchase,
    paymentsByPurchase
  );
  const purchasePayments = payments.filter(
    (payment) => payment.paymentType !== 'supplier_debt_payment'
  );

  return {
    purchase: {
      ...purchase,
      customerDebt: financials.oldDebt,
      ...financials,
    },
    supplier,
    payments: purchasePayments,
    products,
  };
};

export const getSupplierDebt = async (query) => {
  const supplierId = String(query.supplierId || '').trim();
  if (!supplierId) throw new Error('supplierId is required');
  const excludePurchaseId = String(query.excludePurchaseId || '').trim();

  if (excludePurchaseId) {
    const targetPurchase = await findPurchaseById(excludePurchaseId);
    if (targetPurchase?.supplierId === supplierId) {
      const purchases = await findPurchases({
        supplierId,
        isDeleted: { $ne: true },
      });
      const purchaseIds = purchases.map((purchase) => purchase.id);
      const payments = purchaseIds.length
        ? await findPayments({
            purchaseId: { $in: purchaseIds },
            isDeleted: { $ne: true },
          })
        : [];
      const paymentsByPurchase = buildPaymentsByPurchase(payments);
      const oldDebtByPurchase = buildOldDebtByPurchase(
        purchases,
        paymentsByPurchase
      );
      const debt = Number(oldDebtByPurchase[excludePurchaseId] || 0);
      return {
        supplierId,
        total: debt,
        purchasePaid: 0,
        debtPaid: 0,
        paid: 0,
        debt,
      };
    }
  }

  const filter = { supplierId, isDeleted: { $ne: true } };
  if (excludePurchaseId) filter.id = { $ne: excludePurchaseId };
  const purchases = await findPurchases(filter);
  const purchaseIds = purchases.map((purchase) => purchase.id);
  const [payments, supplierDebtPayments] = await Promise.all([
    purchaseIds.length
      ? findPayments({
          purchaseId: { $in: purchaseIds },
          isDeleted: { $ne: true },
        })
      : Promise.resolve([]),
    findPayments({
      supplierId,
      paymentType: 'supplier_debt_payment',
      isDeleted: { $ne: true },
    }),
  ]);

  const total = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total || 0),
    0
  );
  const purchasePaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const debtPaid = supplierDebtPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );
  const paid = purchasePaid + debtPaid;

  return {
    supplierId,
    total,
    purchasePaid,
    debtPaid,
    paid,
    debt: total - paid,
  };
};

export const updatePurchase = async (id, payload) => {
  const existingPurchase = await findPurchaseById(id);
  if (!existingPurchase) throw new Error('Purchase not found');

  const supplierId = String(
    payload.supplierId || existingPurchase.supplierId || ''
  ).trim();
  const items = Array.isArray(payload.items)
    ? payload.items
    : existingPurchase.items || [];
  if (!supplierId) throw new Error('supplierId is required');
  if (!items.length) throw new Error('items is required');

  const sanitizedItems = sanitizePurchaseItems(items);
  const invalid = findInvalidPurchaseItem(sanitizedItems);
  if (invalid) throw new Error('Invalid purchase item');

  const oldQtyMap = buildQtyMapFromItems(existingPurchase.items || []);
  const nextQtyMap = buildQtyMapFromItems(sanitizedItems);
  const productIds = new Set([
    ...Object.keys(oldQtyMap),
    ...Object.keys(nextQtyMap),
  ]);
  const products = productIds.size
    ? await findProductsByIds([...productIds], { activeOnly: true })
    : [];
  if (products.length !== productIds.size) throw new Error('Product not found');

  let updatedProducts = [];
  if (existingPurchase.appliedToStock) {
    const updateTasks = products.map(async (product) => {
      const oldQty = Number(oldQtyMap[product.id] || 0);
      const newQty = Number(nextQtyMap[product.id] || 0);
      const deltaQty = newQty - oldQty;
      if (deltaQty === 0) return null;
      const nextOpeningStock = Number(product.openingStock || 0) + deltaQty;
      return updateProductById(product.id, { openingStock: nextOpeningStock });
    });
    updatedProducts = (await Promise.all(updateTasks)).filter(Boolean);
  }

  const total = sanitizedItems.reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0
  );
  const purchase = await updatePurchaseDoc(id, {
    code: payload.code ?? existingPurchase.code ?? '',
    supplierId,
    date: payload.date || existingPurchase.date || new Date().toISOString(),
    items: sanitizedItems,
    total,
    note: payload.note ?? existingPurchase.note ?? '',
  });

  return { purchase, products: updatedProducts };
};

export const createPurchase = async (payload) => {
  const supplierId = String(payload.supplierId || '').trim();
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!supplierId) throw new Error('supplierId is required');
  if (!items.length) throw new Error('items is required');

  const sanitizedItems = sanitizePurchaseItems(items);
  const invalid = findInvalidPurchaseItem(sanitizedItems);
  if (invalid) throw new Error('Invalid purchase item');

  const productIds = [...new Set(sanitizedItems.map((item) => item.productId))];
  const products = await findProductsByIds(productIds, { activeOnly: true });
  if (products.length !== productIds.length)
    throw new Error('Product not found');

  const [pendingPurchases, invoices] = await Promise.all([
    findPurchases({
      isDeleted: { $ne: true },
      appliedToStock: { $ne: true },
      'items.productId': { $in: productIds },
    }),
    findInvoices({
      isDeleted: { $ne: true },
      'items.productId': { $in: productIds },
    }),
  ]);

  const inQtyMap = buildQtyMapFromPurchases(
    pendingPurchases,
    new Set(productIds)
  );
  const outQtyMap = buildQtyMapFromInvoices(invoices, new Set(productIds));
  const productMap = buildByIdMap(products);
  const updates = {};

  sanitizedItems.forEach((item) => {
    const product = productMap[item.productId];
    const current = updates[item.productId] || {
      openingStock: Number(product.openingStock || 0),
      avgCost: Number(product.avgCost || 0),
    };
    const oldQty =
      Number(current.openingStock || 0) +
      Number(inQtyMap[item.productId] || 0) -
      Number(outQtyMap[item.productId] || 0);
    const nextAvgCost = computeAvgCost(
      oldQty,
      current.avgCost,
      item.qty,
      item.unitCost
    );
    updates[item.productId] = {
      openingStock: Number(current.openingStock || 0) + Number(item.qty || 0),
      avgCost: nextAvgCost,
    };
  });

  const updatedProducts = await Promise.all(
    Object.entries(updates).map(([productId, update]) =>
      updateProductById(productId, update)
    )
  );

  const total = sanitizedItems.reduce(
    (sum, item) => sum + Number(item.lineTotal || 0),
    0
  );
  const purchasePayload = {
    id: payload.id || uuid(),
    code: payload.code || '',
    supplierId,
    date: payload.date || new Date().toISOString(),
    items: sanitizedItems,
    total,
    note: payload.note || '',
    appliedToStock: true,
    isDeleted: false,
    deletedAt: null,
  };

  const purchase = await createPurchaseDoc(purchasePayload);
  return { purchase, products: updatedProducts };
};
