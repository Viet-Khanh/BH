import Cashbook from '../models/Cashbook.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Purchase from '../models/Purchase.js';
import Settings from '../models/Settings.js';
import Supplier from '../models/Supplier.js';
import Unit from '../models/Unit.js';
import { createCrudRouter } from './crud.js';
import dashboardRouter from './dashboard.js';
import dataUpgradeRouter from './dataUpgrade.js';
import invoicesRouter from './invoices.js';
import openingImportRouter from './openingImport.js';
import paymentsRouter from './payments.js';
import productToolsRouter from './productTools.js';
import purchasesRouter from './purchases.js';
import reportRouter from './reports.js';
import salesRouter from './sales.js';

export const crudModels = {
  products: Product,
  customers: Customer,
  suppliers: Supplier,
  purchases: Purchase,
  cashbook: Cashbook,
  settings: Settings,
  units: Unit,
};

const moduleRouters = [
  ['/api/invoices', invoicesRouter],
  ['/api/payments', paymentsRouter],
  ['/api/dashboard', dashboardRouter],
  ['/api/data-upgrade', dataUpgradeRouter],
  ['/api/reports', reportRouter],
  ['/api/sales', salesRouter],
  ['/api/purchases-tools', purchasesRouter],
  ['/api/products-tools', productToolsRouter],
  ['/api/opening-import', openingImportRouter],
];

// Shared by the Express server (app.js) and the browser demo (banhang/src/demo).
export const mountApiRoutes = (app) => {
  Object.entries(crudModels).forEach(([key, model]) => {
    app.use(`/api/${key}`, createCrudRouter(model));
  });
  moduleRouters.forEach(([path, router]) => app.use(path, router));
  return app;
};
