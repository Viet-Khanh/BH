import * as PurchaseService from '../services/purchases.service.js';

export const getRecentPurchases = async (req, res) => {
  const data = await PurchaseService.getRecentPurchases(req.query);
  res.json(data);
};

export const getPurchaseDetail = async (req, res) => {
  try {
    const data = await PurchaseService.getPurchaseDetail(req.params.id);
    res.json(data);
  } catch (err) {
    if (err.message === 'Purchase not found')
      return res.status(404).json({ message: err.message });
    throw err;
  }
};

export const getSupplierDebt = async (req, res) => {
  try {
    const data = await PurchaseService.getSupplierDebt(req.query);
    res.json(data);
  } catch (err) {
    if (err.message === 'supplierId is required')
      return res.status(400).json({ message: err.message });
    throw err;
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const data = await PurchaseService.updatePurchase(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    if (err.message === 'Purchase not found')
      return res.status(404).json({ message: err.message });
    if (
      err.message === 'supplierId is required' ||
      err.message === 'items is required' ||
      err.message === 'Invalid purchase item' ||
      err.message === 'Product not found'
    ) {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
};

export const createPurchase = async (req, res) => {
  try {
    const data = await PurchaseService.createPurchase(req.body);
    res.status(201).json(data);
  } catch (err) {
    if (
      err.message === 'supplierId is required' ||
      err.message === 'items is required' ||
      err.message === 'Invalid purchase item' ||
      err.message === 'Product not found'
    ) {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
};
