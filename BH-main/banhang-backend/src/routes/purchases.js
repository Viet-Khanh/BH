import express from 'express';
import dayjs from 'dayjs';
import { v4 as uuid } from 'uuid';
import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Supplier from '../models/Supplier.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';

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

router.get(
  '/recent',
  asyncHandler(async (req, res) => {
    const { from, to } = parseRange(req.query);
    const supplierId = String(req.query.supplierId || '').trim();
    const rawLimit = Number(req.query.limit || 200);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 1000) : 200;

    const filter = { isDeleted: { $ne: true } };
    if (supplierId) filter.supplierId = supplierId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from.toISOString();
      if (to) filter.date.$lte = to.toISOString();
    }

    const purchases = await Purchase.find(filter)
      .sort({ date: -1 })
      .limit(limit)
      .lean();

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
          So_luong: item.qty,
          Don_gia: item.unitCost,
          Thanh_tien: item.lineTotal,
        };
      });
    });

    const rows = purchases.map((purchase) => ({
      id: purchase.id,
      code: purchase.code,
      date: purchase.date,
      supplierId: purchase.supplierId,
      total: purchase.total,
      note: purchase.note,
    }));

    res.json({ rows, exportRows });
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

    const [supplier, payments] = await Promise.all([
      Supplier.findOne({ id: purchase.supplierId, isDeleted: { $ne: true } }).lean(),
      Payment.find({ purchaseId: purchase.id, isDeleted: { $ne: true } }).lean(),
    ]);

    const productIds = new Set();
    (purchase.items || []).forEach((item) => {
      if (item.productId) productIds.add(item.productId);
    });
    const products = productIds.size
      ? await Product.find({ id: { $in: [...productIds] } }).lean()
      : [];

    res.json({ purchase, supplier, payments, products });
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
    const filter = { supplierId, isDeleted: { $ne: true } };
    if (excludePurchaseId) filter.id = { $ne: excludePurchaseId };
    const purchases = await Purchase.find(filter).lean();
    const purchaseIds = purchases.map((purchase) => purchase.id);
    const payments = purchaseIds.length
      ? await Payment.find({ purchaseId: { $in: purchaseIds }, isDeleted: { $ne: true } }).lean()
      : [];

    const total = purchases.reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);
    const paid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    res.json({
      supplierId,
      total,
      paid,
      debt: total - paid,
    });
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

    const sanitizedItems = items.map((item) => {
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

    const invalid = sanitizedItems.find(
      (item) => !item.productId || item.qty <= 0 || item.unitCost < 0
    );
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
