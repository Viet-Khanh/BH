import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { crudModels, mountApiRoutes } from './routes/index.js';
import Product from './models/Product.js';
import Customer from './models/Customer.js';
import Supplier from './models/Supplier.js';
import Purchase from './models/Purchase.js';
import Invoice from './models/Invoice.js';
import Payment from './models/Payment.js';
import Cashbook from './models/Cashbook.js';
import Settings from './models/Settings.js';
import Unit from './models/Unit.js';
import { buildSeedData } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const models = crudModels;

const seedModels = {
  ...models,
  invoices: Invoice,
  payments: Payment,
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export const createApp = (options = {}) => {
  const frontendDist =
    options.frontendDist ||
    process.env.FRONTEND_DIST ||
    path.resolve(__dirname, '../../banhang/dist');
  const shouldServeFrontend =
    options.shouldServeFrontend ?? process.env.SERVE_FRONTEND !== 'false';

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ ok: true });
  });

  mountApiRoutes(app);

  if (shouldServeFrontend && fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ message: 'Not found' });
        return;
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  const resetAll = async () => {
    await Promise.all(
      Object.values(seedModels).map((Model) => Model.deleteMany({}))
    );
  };

  app.post(
    '/api/reset',
    asyncHandler(async (req, res) => {
      await resetAll();
      res.json({ ok: true });
    })
  );

  app.post(
    '/api/seed',
    asyncHandler(async (req, res) => {
      const data = buildSeedData();
      await resetAll();

      const tasks = [];
      if (data.products?.length) tasks.push(Product.insertMany(data.products));
      if (data.customers?.length)
        tasks.push(Customer.insertMany(data.customers));
      if (data.suppliers?.length)
        tasks.push(Supplier.insertMany(data.suppliers));
      if (data.purchases?.length)
        tasks.push(Purchase.insertMany(data.purchases));
      if (data.invoices?.length) tasks.push(Invoice.insertMany(data.invoices));
      if (data.payments?.length) tasks.push(Payment.insertMany(data.payments));
      if (data.cashbook?.length) tasks.push(Cashbook.insertMany(data.cashbook));
      if (data.settings?.length) tasks.push(Settings.insertMany(data.settings));
      if (data.units?.length) tasks.push(Unit.insertMany(data.units));

      await Promise.all(tasks);
      res.json({ ok: true });
    })
  );

  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Server error' });
  });

  return app;
};
