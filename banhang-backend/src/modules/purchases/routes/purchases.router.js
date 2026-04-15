import express from 'express';
import * as PurchaseController from '../controllers/purchases.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/recent', asyncHandler(PurchaseController.getRecentPurchases));
router.get('/detail/:id', asyncHandler(PurchaseController.getPurchaseDetail));
router.get('/supplier-debt', asyncHandler(PurchaseController.getSupplierDebt));
router.put('/:id', asyncHandler(PurchaseController.updatePurchase));
router.post('/', asyncHandler(PurchaseController.createPurchase));

export default router;
