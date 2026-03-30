import express from 'express';
import { v4 as uuid } from 'uuid';

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const sanitizePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return {};
  const { _id, __v, ...rest } = payload;
  return rest;
};

const ensureActive = (payload) => {
  if (payload.isDeleted === undefined) payload.isDeleted = false;
  if (payload.deletedAt === undefined) payload.deletedAt = null;
  return payload;
};

const normalizeProductName = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const uniqueNames = (items = []) => [...new Set(items.filter(Boolean))];

const formatDuplicateProductMessage = (names = []) => {
  const deduped = uniqueNames(names.map((name) => String(name ?? '').trim()));
  if (!deduped.length) return 'Trùng sản phẩm.';
  const preview = deduped.slice(0, 5).join(', ');
  const suffix = deduped.length > 5 ? ` và ${deduped.length - 5} sản phẩm khác` : '';
  return `Trùng sản phẩm: ${preview}${suffix}.`;
};

const findDuplicateNamesInPayload = (items = []) => {
  const seen = new Map();
  const duplicates = [];

  items.forEach((item) => {
    const rawName = String(item?.name ?? '').trim();
    const normalized = normalizeProductName(rawName);
    if (!normalized) return;
    if (seen.has(normalized)) {
      duplicates.push(rawName || seen.get(normalized));
      return;
    }
    seen.set(normalized, rawName);
  });

  return uniqueNames(duplicates);
};

const findExistingProductNameConflicts = async (Model, items = [], { excludeId } = {}) => {
  const candidates = items
    .map((item) => ({
      rawName: String(item?.name ?? '').trim(),
      normalized: normalizeProductName(item?.name),
    }))
    .filter((item) => item.normalized);

  if (!candidates.length) return [];

  const filter = { isDeleted: { $ne: true } };
  if (excludeId) filter.id = { $ne: excludeId };

  const existingProducts = await Model.find(filter, { id: 1, name: 1 }).lean();
  const existingNameSet = new Set(
    existingProducts
      .map((item) => normalizeProductName(item?.name))
      .filter(Boolean)
  );

  return uniqueNames(
    candidates
      .filter((item) => existingNameSet.has(item.normalized))
      .map((item) => item.rawName)
  );
};

export const createCrudRouter = (Model) => {
  const router = express.Router();
  const isInvoiceModel = Model.modelName === 'Invoice';
  const isPaymentModel = Model.modelName === 'Payment';
  const isProductModel = Model.modelName === 'Product';

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const includeDeleted = req.query.includeDeleted === '1';
      const filter = includeDeleted ? {} : { isDeleted: { $ne: true } };
      const data = await Model.find(filter).lean();
      res.json(data);
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await Model.findOne({ id: req.params.id }).lean();
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(doc);
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const payload = ensureActive(sanitizePayload(req.body));
      if (isProductModel) {
        const duplicateNames = await findExistingProductNameConflicts(Model, [payload]);
        if (duplicateNames.length) {
          res.status(400).json({ message: formatDuplicateProductMessage(duplicateNames) });
          return;
        }
      }
      if (!payload.id) payload.id = uuid();
      const doc = await Model.create(payload);
      res.status(201).json(doc);
    })
  );

  router.post(
    '/bulk',
    asyncHandler(async (req, res) => {
      const items = Array.isArray(req.body) ? req.body : [];
      const payload = items.map((item) => {
        const clean = ensureActive(sanitizePayload(item));
        return { ...clean, id: clean.id || uuid() };
      });
      if (isProductModel) {
        const duplicateNamesInPayload = findDuplicateNamesInPayload(payload);
        if (duplicateNamesInPayload.length) {
          res.status(400).json({
            message: formatDuplicateProductMessage(duplicateNamesInPayload),
          });
          return;
        }

        const duplicateNames = await findExistingProductNameConflicts(Model, payload);
        if (duplicateNames.length) {
          res.status(400).json({ message: formatDuplicateProductMessage(duplicateNames) });
          return;
        }
      }
      const docs = await Model.insertMany(payload, { ordered: false });
      res.status(201).json(docs);
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const payload = sanitizePayload(req.body);
      if (isProductModel) {
        const duplicateNames = await findExistingProductNameConflicts(Model, [payload], {
          excludeId: req.params.id,
        });
        if (duplicateNames.length) {
          res.status(400).json({ message: formatDuplicateProductMessage(duplicateNames) });
          return;
        }
      }
      let existing = null;
      if (isInvoiceModel) {
        existing = await Model.findOne({ id: req.params.id }).lean();
        if (
          existing &&
          payload.customerId !== undefined &&
          String(payload.customerId || '') !== String(existing.customerId || '')
        ) {
          res.status(400).json({ message: 'Không thể đổi khách hàng của hóa đơn đã tạo.' });
          return;
        }
      }
      if (isPaymentModel) {
        existing = existing || (await Model.findOne({ id: req.params.id }).lean());
        if (existing?.paymentType === 'debt_receipt') {
          const immutableFields = ['customerId', 'paymentType', 'invoiceId', 'purchaseId', 'supplierId', 'code'];
          const changedField = immutableFields.find(
            (field) =>
              payload[field] !== undefined &&
              String(payload[field] ?? '') !== String(existing[field] ?? '')
          );
          if (changedField) {
            res.status(400).json({
              message: 'Không thể đổi khách hàng hoặc loại của phiếu thu nợ đã tạo.',
            });
            return;
          }
        }
      }
      payload.id = req.params.id;
      const doc = await Model.findOneAndUpdate(
        { id: req.params.id },
        { $set: payload },
        {
          new: true,
          upsert: true,
        }
      ).lean();
      res.json(doc);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const deletedAt = new Date().toISOString();
      const doc = await Model.findOneAndUpdate(
        { id: req.params.id },
        { $set: { isDeleted: true, deletedAt } },
        { new: true }
      ).lean();
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json({ ok: true });
    })
  );

  return router;
};
