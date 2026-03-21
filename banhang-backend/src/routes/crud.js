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

export const createCrudRouter = (Model) => {
  const router = express.Router();
  const isInvoiceModel = Model.modelName === 'Invoice';

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
      const docs = await Model.insertMany(payload, { ordered: false });
      res.status(201).json(docs);
    })
  );

  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const payload = sanitizePayload(req.body);
      if (isInvoiceModel) {
        const existing = await Model.findOne({ id: req.params.id }).lean();
        if (
          existing &&
          payload.customerId !== undefined &&
          String(payload.customerId || '') !== String(existing.customerId || '')
        ) {
          res.status(400).json({ message: 'Không thể đổi khách hàng của hóa đơn đã tạo.' });
          return;
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
