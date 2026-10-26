import express from 'express';
import * as EinvoiceController from '../controllers/einvoice.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/documents', asyncHandler(EinvoiceController.getDocuments));
router.get('/summary', asyncHandler(EinvoiceController.getSummary));
router.post(
  '/mark-exported',
  asyncHandler(EinvoiceController.postMarkExported)
);
router.post(
  '/mark-adjusted',
  asyncHandler(EinvoiceController.postMarkAdjusted)
);
router.post('/results', asyncHandler(EinvoiceController.postResults));
router.post('/unmark', asyncHandler(EinvoiceController.postUnmark));
router.put('/:invoiceId/number', asyncHandler(EinvoiceController.putNumber));

export default router;
