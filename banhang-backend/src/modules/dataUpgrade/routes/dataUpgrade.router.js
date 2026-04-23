import express from 'express';
import * as DataUpgradeController from '../controllers/dataUpgrade.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/status', asyncHandler(DataUpgradeController.getStatus));
router.get('/reconcile', asyncHandler(DataUpgradeController.reconcile));
router.post('/preview', asyncHandler(DataUpgradeController.preview));
router.post('/commit', asyncHandler(DataUpgradeController.commit));

export default router;
