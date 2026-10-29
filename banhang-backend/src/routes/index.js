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
import einvoiceRouter from './einvoice.js';
import invoicesRouter from './invoices.js';
import openingImportRouter from './openingImport.js';
import paymentsRouter from './payments.js';
import productCodesRouter from './productCodes.js';
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

// Routers sharing a CRUD path; mounted first so `/:id` does not capture them.
const preCrudRouters = [['/api/products', productCodesRouter]];

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
  ['/api/einvoice', einvoiceRouter],
];

const mountModuleRouters = (app, modules) =>
  modules.forEach((module) =>
    module.routers.forEach(([path, router]) => app.use(path, router))
  );

// Shared by the Express server (app.js) and the browser demo (banhang/src/demo).
// `modules`: edition/customer backend modules (src/platform/loadBackendModules.js).
export const mountApiRoutes = (app, { modules = [] } = {}) => {
  preCrudRouters.forEach(([path, router]) => app.use(path, router));
  Object.entries(crudModels).forEach(([key, model]) => {
    app.use(`/api/${key}`, createCrudRouter(model));
  });
  moduleRouters.forEach(([path, router]) => app.use(path, router));
  mountModuleRouters(app, modules);
  return app;
};
