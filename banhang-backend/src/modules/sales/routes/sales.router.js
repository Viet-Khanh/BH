import express from 'express';
import * as SalesController from '../controllers/sales.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/products', asyncHandler(SalesController.getProducts));
router.get('/customer-debt', asyncHandler(SalesController.getCustomerDebt));

export default router;
