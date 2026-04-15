import express from 'express';
import * as ReportController from '../controllers/reports.controller.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/stock', asyncHandler(ReportController.getStockReport));
router.get(
  '/stock-movement',
  asyncHandler(ReportController.getStockMovementReport)
);
router.get('/debt', asyncHandler(ReportController.getDebtReport));
router.get(
  '/supplier-debt',
  asyncHandler(ReportController.getSupplierDebtReport)
);
router.get(
  '/supplier-debt/:supplierId',
  asyncHandler(ReportController.getSupplierDebtDetails)
);
router.get(
  '/debt/:customerId',
  asyncHandler(ReportController.getCustomerDebtDetails)
);
router.get(
  '/sales-invoices',
  asyncHandler(ReportController.getSalesInvoicesReport)
);
router.get(
  '/customer-debt-timeline',
  asyncHandler(ReportController.getCustomerDebtTimelineReport)
);
router.get(
  '/sales-details',
  asyncHandler(ReportController.getSalesDetailsReport)
);
router.get(
  '/invoice-history',
  asyncHandler(ReportController.getInvoiceHistory)
);
router.get(
  '/invoices/:id/preview',
  asyncHandler(ReportController.getInvoicePreview)
);
router.get('/invoices/:id', asyncHandler(ReportController.getInvoiceDetail));
router.delete(
  '/invoices/:id',
  asyncHandler(ReportController.deleteInvoiceCascade)
);
router.get('/profit', asyncHandler(ReportController.getProfitReport));
router.get('/cash', asyncHandler(ReportController.getCashReport));

export default router;
