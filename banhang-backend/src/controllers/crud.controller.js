import {
  getAllItems,
  getItemById,
  createItem,
  bulkCreateItems,
  updateItem,
  deleteItem,
} from '../services/crud.service.js';

export const createCrudController = (Model) => {
  return {
    getAll: async (req, res) => {
      const includeDeleted = req.query.includeDeleted === '1';
      const data = await getAllItems(Model, includeDeleted);
      res.json(data);
    },

    getById: async (req, res) => {
      const doc = await getItemById(Model, req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json(doc);
    },

    create: async (req, res) => {
      try {
        const doc = await createItem(Model, req.body);
        res.status(201).json(doc);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },

    bulkCreate: async (req, res) => {
      try {
        const items = Array.isArray(req.body) ? req.body : [];
        const docs = await bulkCreateItems(Model, items);
        res.status(201).json(docs);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },

    update: async (req, res) => {
      try {
        const doc = await updateItem(Model, req.params.id, req.body);
        res.json(doc);
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
    },

    remove: async (req, res) => {
      const doc = await deleteItem(Model, req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      res.json({ ok: true });
    },
  };
};
