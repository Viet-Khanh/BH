import express from 'express';
import * as OpeningImportController from '../controllers/openingImport.controller.js';

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post('/preview', asyncHandler(OpeningImportController.preview));
router.post('/commit', asyncHandler(OpeningImportController.commit));

export default router;
