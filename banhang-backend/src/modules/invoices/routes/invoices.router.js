import express from 'express';
import * as InvoiceController from '../controllers/invoices.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', asyncHandler(InvoiceController.getAll));
router.get('/:id', asyncHandler(InvoiceController.getById));
router.post('/', asyncHandler(InvoiceController.create));
router.post('/bulk', asyncHandler(InvoiceController.bulkCreate));
router.put('/:id', asyncHandler(InvoiceController.update));
router.delete('/:id', asyncHandler(InvoiceController.remove));

export default router;
