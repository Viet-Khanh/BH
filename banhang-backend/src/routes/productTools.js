import express from 'express';
import * as ProductToolsController from '../controllers/productTools.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post(
  '/price-update-by-name',
  asyncHandler(ProductToolsController.updatePriceByName)
);
router.post(
  '/fill-missing-avg-cost-from-retail',
  asyncHandler(ProductToolsController.fillMissingAvgCostFromRetail)
);

export default router;
