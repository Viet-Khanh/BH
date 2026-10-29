import express from 'express';
import * as ProductCodesController from '../controllers/productCodes.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Mounted on /api/products before the generic CRUD router (whose /:id would catch it).
router.get('/next-code', asyncHandler(ProductCodesController.getNextCode));

export default router;
