import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCrudRouter } from './routes/crud.js';
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
import reportRouter from './routes/reports.js';
import salesRouter from './routes/sales.js';
import purchasesRouter from './routes/purchases.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/banhang';
const FRONTEND_DIST =
  process.env.FRONTEND_DIST || path.resolve(__dirname, '../../banhang/dist');
const SHOULD_SERVE_FRONTEND = process.env.SERVE_FRONTEND !== 'false';

const models = {
  products: Product,
  customers: Customer,
  suppliers: Supplier,
  purchases: Purchase,
  invoices: Invoice,
  payments: Payment,
  cashbook: Cashbook,
  settings: Settings,
  units: Unit,
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

Object.entries(models).forEach(([key, model]) => {
  app.use(`/api/${key}`, createCrudRouter(model));
});
app.use('/api/reports', reportRouter);
app.use('/api/sales', salesRouter);
app.use('/api/purchases-tools', purchasesRouter);

if (SHOULD_SERVE_FRONTEND && fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ message: 'Not found' });
      return;
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

const resetAll = async () => {
  await Promise.all(Object.values(models).map((Model) => Model.deleteMany({})));
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
    if (data.customers?.length) tasks.push(Customer.insertMany(data.customers));
    if (data.suppliers?.length) tasks.push(Supplier.insertMany(data.suppliers));
    if (data.purchases?.length) tasks.push(Purchase.insertMany(data.purchases));
    if (data.invoices?.length) tasks.push(Invoice.insertMany(data.invoices));
    if (data.payments?.length) tasks.push(Payment.insertMany(data.payments));
    if (data.cashbook?.length) tasks.push(Cashbook.insertMany(data.cashbook));
    if (data.settings?.length) tasks.push(Settings.insertMany(data.settings));
    if (data.units?.length) tasks.push(Unit.insertMany(data.units));

    await Promise.all(tasks);
    res.json({ ok: true });
  })
);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

const start = async () => {
  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Ban hang API running on http://localhost:${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
