import express from 'express';
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Supplier from '../models/Supplier.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import { computeStock } from '../utils/stock.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const toStartOfDay = (value) => dayjs(value).startOf('day');
const toEndOfDay = (value) => dayjs(value).endOf('day');
const isValidDate = (value) => value && dayjs(value).isValid();

const parseRange = (query) => {
  const from = isValidDate(query.from) ? toStartOfDay(query.from) : null;
  const to = isValidDate(query.to) ? toEndOfDay(query.to) : null;
  return { from, to };
};

const parsePagination = (query = {}) => {
  const rawPage = Number(query.page || 1);
  const rawPageSize = Number(query.pageSize || 20);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize > 0
      ? Math.min(Math.floor(rawPageSize), 200)
      : 20;
  return { page, pageSize };
};

const buildPaymentsByPurchase = (payments = []) =>
  payments.reduce((acc, payment) => {
    if (!payment.purchaseId) return acc;
    if (payment.paymentType === 'supplier_debt_payment') return acc;
    acc[payment.purchaseId] = (acc[payment.purchaseId] || 0) + Number(payment.amount || 0);
    return acc;
  }, {});

const buildOldDebtByPurchase = (purchases = [], paymentsByPurchase = {}) => {
  const sorted = [...purchases].sort((a, b) => new Date(a.date) - new Date(b.date));
  const supplierDebt = {};
  const map = {};
  sorted.forEach((purchase) => {
    const paid = paymentsByPurchase[purchase.id] || 0;
    const total = Number(purchase.total || 0);
    map[purchase.id] = supplierDebt[purchase.supplierId] || 0;
    supplierDebt[purchase.supplierId] = (supplierDebt[purchase.supplierId] || 0) + total - paid;
  });
  return map;
};

const buildByIdMap = (items = []) =>
  items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

const getLineTotal = ({ qty, unitCost, length, width }) => {
  let total = Number(qty || 0) * Number(unitCost || 0);
  const lengthValue = Number(length || 0);
  const widthValue = Number(width || 0);
  if (lengthValue > 0 && widthValue > 0) {
    total *= lengthValue * widthValue;
  }
  return total;
};

const getPurchaseAmount = (purchase = {}) => {
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

const buildPurchaseFinancials = (purchase, oldDebtByPurchase = {}, paymentsByPurchase = {}) => {
  const amount = getPurchaseAmount(purchase);
  const oldDebt = Number(oldDebtByPurchase[purchase.id] || 0);
  const paid = Number(paymentsByPurchase[purchase.id] || 0);
  const totalPay = amount + oldDebt;
  const remain = totalPay - paid;
  return { amount, oldDebt, totalPay, paid, remain };
};

const computeAvgCost = (oldQty, oldAvgCost, inQty, inCost) => {
  const totalQty = Number(oldQty) + Number(inQty);
  if (totalQty <= 0) return Number(oldAvgCost) || Number(inCost) || 0;
  const totalCost = Number(oldQty) * Number(oldAvgCost || 0) + Number(inQty) * Number(inCost || 0);
  return totalCost / totalQty;
};

const buildQtyMapFromPurchases = (purchases = [], productIds = new Set()) => {
  const map = {};
  purchases.forEach((purchase) => {
    (purchase.items || []).forEach((item) => {
      if (!productIds.has(item.productId)) return;
      map[item.productId] = (map[item.productId] || 0) + Number(item.qty || 0);
    });
  });
  return map;
};

const buildQtyMapFromInvoices = (invoices = [], productIds = new Set()) => {
  const map = {};
  invoices.forEach((invoice) => {
    (invoice.items || []).forEach((item) => {
      if (!productIds.has(item.productId)) return;
      map[item.productId] = (map[item.productId] || 0) + Number(item.qty || 0);
    });
  });
  return map;
};

const sanitizePurchaseItems = (items = []) =>
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

const findInvalidPurchaseItem = (items = []) =>
  items.find((item) => !item.productId);

const buildQtyMapFromItems = (items = []) =>
  items.reduce((acc, item) => {
    if (!item?.productId) return acc;
    acc[item.productId] = (acc[item.productId] || 0) + Number(item.qty || 0);
    return acc;
  }, {});

router.get(
  '/recent',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const supplierId = String(req.query.supplierId || '').trim();
    const hasPagination = req.query.page !== undefined || req.query.pageSize !== undefined;
    const { page, pageSize } = parsePagination(req.query);
    const rawLimit = Number(req.query.limit || 200);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 200;

    const baseFilter = { isDeleted: { $ne: true } };
    if (supplierId) baseFilter.supplierId = supplierId;
    const recentFilter = { ...baseFilter };
    if (from || to) {
      recentFilter.date = {};
      if (from) recentFilter.date.$gte = from.toISOString();
      if (to) recentFilter.date.$lte = to.toISOString();
    }

    const [allFilteredPurchases, purchasesForDebt] = await Promise.all([
      hasPagination
        ? Purchase.find(recentFilter).sort({ date: -1 }).lean()
        : Purchase.find(recentFilter).sort({ date: -1 }).limit(limit).lean(),
      Purchase.find(baseFilter).lean(),
    ]);
    const purchaseIdsForDebt = purchasesForDebt.map((purchase) => purchase.id);
    const debtPayments = purchaseIdsForDebt.length
      ? await Payment.find({
          purchaseId: { $in: purchaseIdsForDebt },
          isDeleted: { $ne: true },
        }).lean()
      : [];
    const paymentsByPurchase = buildPaymentsByPurchase(debtPayments);
    const oldDebtByPurchase = buildOldDebtByPurchase(purchasesForDebt, paymentsByPurchase);

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
      {
        amount: 0,
        paid: 0,
        remain: 0,
        totalPay: 0,
      }
    );

    const total = allFilteredPurchases.length;
    const totalPages = hasPagination ? Math.max(1, Math.ceil(total / pageSize)) : 1;
    const currentPage = hasPagination ? Math.min(page, totalPages) : 1;
    const start = (currentPage - 1) * pageSize;
    const purchases = hasPagination
      ? allFilteredPurchases.slice(start, start + pageSize)
      : allFilteredPurchases;
    const effectivePageSize = hasPagination ? pageSize : purchases.length || limit;

    const supplierIds = new Set(purchases.map((purchase) => purchase.supplierId).filter(Boolean));
    const suppliers = supplierIds.size
      ? await Supplier.find({ id: { $in: [...supplierIds] } }).lean()
      : [];
    const supplierMap = buildByIdMap(suppliers);

    const productIds = new Set();
    purchases.forEach((purchase) => {
      (purchase.items || []).forEach((item) => {
        if (item.productId) productIds.add(item.productId);
      });
    });
    const products = productIds.size
      ? await Product.find({ id: { $in: [...productIds] } }).lean()
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
      qtySum: (purchase.items || []).reduce((sum, item) => sum + Number(item.qty || 0), 0),
      amount: Number(purchase.total || 0),
      total: Number(purchase.total || 0),
      paid: Number(paymentsByPurchase[purchase.id] || 0),
      oldDebt: Number(oldDebtByPurchase[purchase.id] || 0),
      totalPay: Number(purchase.total || 0) + Number(oldDebtByPurchase[purchase.id] || 0),
      remain:
        Number(purchase.total || 0) +
        Number(oldDebtByPurchase[purchase.id] || 0) -
        Number(paymentsByPurchase[purchase.id] || 0),
      supplierName: supplierMap[purchase.supplierId]?.name || '',
      phone: supplierMap[purchase.supplierId]?.phone || '',
      address: supplierMap[purchase.supplierId]?.address || '',
      note: purchase.note,
    }));

    res.json({
      rows,
      exportRows,
      summary,
      pagination: {
        total,
        page: currentPage,
        pageSize: effectivePageSize,
        totalPages,
      },
    });
  })
);

router.get(
  '/detail/:id',
  asyncHandler(async (req, res) => {
    const purchase = await Purchase.findOne({
      id: req.params.id,
      isDeleted: { $ne: true },
    }).lean();
    if (!purchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }

    const [supplier, payments, purchases, invoices] = await Promise.all([
      Supplier.findOne({ id: purchase.supplierId, isDeleted: { $ne: true } }).lean(),
      Payment.find({ purchaseId: purchase.id, isDeleted: { $ne: true } }).lean(),
      Purchase.find({ isDeleted: { $ne: true } }).lean(),
      Invoice.find({ isDeleted: { $ne: true } }).lean(),
    ]);

    const productIds = new Set();
    (purchase.items || []).forEach((item) => {
      if (item.productId) productIds.add(item.productId);
    });
    const baseProducts = productIds.size
      ? await Product.find({ id: { $in: [...productIds] } }).lean()
      : [];
    const products = baseProducts.map((product) => ({
      ...product,
      stock: computeStock(product.id, purchases, invoices, baseProducts),
    }));

    const supplierPurchases = purchases.filter((item) => item.supplierId === purchase.supplierId);
    const supplierPurchaseIds = supplierPurchases.map((item) => item.id);
    const supplierPayments = supplierPurchaseIds.length
      ? await Payment.find({
          purchaseId: { $in: supplierPurchaseIds },
          isDeleted: { $ne: true },
        }).lean()
      : [];
    const paymentsByPurchase = buildPaymentsByPurchase(supplierPayments);
    const oldDebtByPurchase = buildOldDebtByPurchase(supplierPurchases, paymentsByPurchase);
    const financials = buildPurchaseFinancials(purchase, oldDebtByPurchase, paymentsByPurchase);
    const purchasePayments = payments.filter((payment) => payment.paymentType !== 'supplier_debt_payment');

    res.json({
      purchase: {
        ...purchase,
        customerDebt: financials.oldDebt,
        ...financials,
      },
      supplier,
      payments: purchasePayments,
      products,
    });
  })
);

router.get(
  '/supplier-debt',
  asyncHandler(async (req, res) => {
    const supplierId = String(req.query.supplierId || '').trim();
    if (!supplierId) {
      res.status(400).json({ message: 'supplierId is required' });
      return;
    }
    const excludePurchaseId = String(req.query.excludePurchaseId || '').trim();

    if (excludePurchaseId) {
      const targetPurchase = await Purchase.findOne({
        id: excludePurchaseId,
        isDeleted: { $ne: true },
      }).lean();
      if (targetPurchase?.supplierId === supplierId) {
        const purchases = await Purchase.find({ supplierId, isDeleted: { $ne: true } }).lean();
        const purchaseIds = purchases.map((purchase) => purchase.id);
        const payments = purchaseIds.length
          ? await Payment.find({ purchaseId: { $in: purchaseIds }, isDeleted: { $ne: true } }).lean()
          : [];
        const paymentsByPurchase = buildPaymentsByPurchase(payments);
        const oldDebtByPurchase = buildOldDebtByPurchase(purchases, paymentsByPurchase);
        const debt = Number(oldDebtByPurchase[excludePurchaseId] || 0);
        res.json({
          supplierId,
          total: debt,
          purchasePaid: 0,
          debtPaid: 0,
          paid: 0,
          debt,
        });
        return;
      }
    }

    const filter = { supplierId, isDeleted: { $ne: true } };
    if (excludePurchaseId) filter.id = { $ne: excludePurchaseId };
    const purchases = await Purchase.find(filter).lean();
    const purchaseIds = purchases.map((purchase) => purchase.id);
    const [payments, supplierDebtPayments] = await Promise.all([
      purchaseIds.length
        ? Payment.find({ purchaseId: { $in: purchaseIds }, isDeleted: { $ne: true } }).lean()
        : Promise.resolve([]),
      Payment.find({
        supplierId,
        paymentType: 'supplier_debt_payment',
        isDeleted: { $ne: true },
      }).lean(),
    ]);

    const total = purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
    const purchasePaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const debtPaid = supplierDebtPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const paid = purchasePaid + debtPaid;

    res.json({
      supplierId,
      total,
      purchasePaid,
      debtPaid,
      paid,
      debt: total - paid,
    });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existingPurchase = await Purchase.findOne({
      id: req.params.id,
      isDeleted: { $ne: true },
    }).lean();
    if (!existingPurchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }

    const payload = req.body || {};
    const supplierId = String(payload.supplierId || existingPurchase.supplierId || '').trim();
    const items = Array.isArray(payload.items) ? payload.items : existingPurchase.items || [];
    if (!supplierId) {
      res.status(400).json({ message: 'supplierId is required' });
      return;
    }
    if (!items.length) {
      res.status(400).json({ message: 'items is required' });
      return;
    }

    const sanitizedItems = sanitizePurchaseItems(items);
    const invalid = findInvalidPurchaseItem(sanitizedItems);
    if (invalid) {
      res.status(400).json({ message: 'Invalid purchase item' });
      return;
    }

    const oldQtyMap = buildQtyMapFromItems(existingPurchase.items || []);
    const nextQtyMap = buildQtyMapFromItems(sanitizedItems);
    const productIds = new Set([...Object.keys(oldQtyMap), ...Object.keys(nextQtyMap)]);
    const products = productIds.size
      ? await Product.find({
          id: { $in: [...productIds] },
          isDeleted: { $ne: true },
        }).lean()
      : [];
    if (products.length !== productIds.size) {
      res.status(400).json({ message: 'Product not found' });
      return;
    }

    let updatedProducts = [];
    if (existingPurchase.appliedToStock) {
      const updateTasks = products.map((product) => {
        const oldQty = Number(oldQtyMap[product.id] || 0);
        const newQty = Number(nextQtyMap[product.id] || 0);
        const deltaQty = newQty - oldQty;
        if (deltaQty === 0) return null;
        const nextOpeningStock = Number(product.openingStock || 0) + deltaQty;
        return Product.findOneAndUpdate(
          { id: product.id },
          { $set: { openingStock: nextOpeningStock } },
          { new: true }
        ).lean();
      });
      updatedProducts = (await Promise.all(updateTasks.filter(Boolean))).filter(Boolean);
    }

    const total = sanitizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
    const purchase = await Purchase.findOneAndUpdate(
      { id: req.params.id, isDeleted: { $ne: true } },
      {
        $set: {
          code: payload.code ?? existingPurchase.code ?? '',
          supplierId,
          date: payload.date || existingPurchase.date || new Date().toISOString(),
          items: sanitizedItems,
          total,
          note: payload.note ?? existingPurchase.note ?? '',
        },
      },
      { new: true }
    ).lean();

    res.json({ purchase, products: updatedProducts });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = req.body || {};
    const supplierId = String(payload.supplierId || '').trim();
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!supplierId) {
      res.status(400).json({ message: 'supplierId is required' });
      return;
    }
    if (!items.length) {
      res.status(400).json({ message: 'items is required' });
      return;
    }

    const sanitizedItems = sanitizePurchaseItems(items);

    const invalid = findInvalidPurchaseItem(sanitizedItems);
    if (invalid) {
      res.status(400).json({ message: 'Invalid purchase item' });
      return;
    }

    const productIds = new Set(sanitizedItems.map((item) => item.productId));
    const products = await Product.find({
      id: { $in: [...productIds] },
      isDeleted: { $ne: true },
    }).lean();
    if (products.length !== productIds.size) {
      res.status(400).json({ message: 'Product not found' });
      return;
    }

    const [pendingPurchases, invoices] = await Promise.all([
      Purchase.find({
        isDeleted: { $ne: true },
        appliedToStock: { $ne: true },
        'items.productId': { $in: [...productIds] },
      }).lean(),
      Invoice.find({
        isDeleted: { $ne: true },
        'items.productId': { $in: [...productIds] },
      }).lean(),
    ]);

    const inQtyMap = buildQtyMapFromPurchases(pendingPurchases, productIds);
    const outQtyMap = buildQtyMapFromInvoices(invoices, productIds);
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
        Product.findOneAndUpdate(
          { id: productId },
          { $set: { avgCost: update.avgCost, openingStock: update.openingStock } },
          { new: true }
        ).lean()
      )
    );

    const total = sanitizedItems.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
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

    const purchase = await Purchase.create(purchasePayload);

    res.status(201).json({ purchase, products: updatedProducts });
  })
);

export default router;
