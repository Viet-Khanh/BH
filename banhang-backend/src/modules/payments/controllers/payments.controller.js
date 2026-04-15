import * as PaymentService from '../services/payments.service.js';

export const getAll = async (req, res) => {
  const includeDeleted = req.query.includeDeleted === '1';
  const data = await PaymentService.getAllPayments(includeDeleted);
  res.json(data);
};

export const getById = async (req, res) => {
  const doc = await PaymentService.getPayment(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
};

export const create = async (req, res) => {
  try {
    const doc = await PaymentService.createPaymentItem(req.body);
    res.status(201).json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const bulkCreate = async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : [];
    const docs = await PaymentService.bulkCreatePayments(items);
    res.status(201).json(docs);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const doc = await PaymentService.updatePaymentItem(req.params.id, req.body);
    res.json(doc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const remove = async (req, res) => {
  const doc = await PaymentService.deletePaymentItem(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json({ ok: true });
};
