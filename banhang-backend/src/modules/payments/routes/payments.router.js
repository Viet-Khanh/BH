import express from 'express';
import * as PaymentController from '../controllers/payments.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', asyncHandler(PaymentController.getAll));
router.get('/:id', asyncHandler(PaymentController.getById));
router.post('/', asyncHandler(PaymentController.create));
router.post('/bulk', asyncHandler(PaymentController.bulkCreate));
router.put('/:id', asyncHandler(PaymentController.update));
router.delete('/:id', asyncHandler(PaymentController.remove));

export default router;
