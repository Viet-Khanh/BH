import express from 'express';
import { createCrudController } from '../controllers/crud.controller.js';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const createCrudRouter = (Model) => {
  const router = express.Router();
  const controller = createCrudController(Model);

  router.get('/', asyncHandler(controller.getAll));
  router.get('/:id', asyncHandler(controller.getById));
  router.post('/', asyncHandler(controller.create));
  router.post('/bulk', asyncHandler(controller.bulkCreate));
  router.put('/:id', asyncHandler(controller.update));
  router.delete('/:id', asyncHandler(controller.remove));

  return router;
};
