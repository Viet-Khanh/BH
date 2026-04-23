import express from 'express';
import * as DashboardController from '../controllers/dashboard.controller.js';

const router = express.Router();

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get('/today', asyncHandler(DashboardController.getTodayDashboard));

export default router;
