import { parseRange } from '../../../utils/reportHelpers.js';
import {
  buildStockCard,
  buildStockMovementRows,
} from '../../../utils/stockMovement.js';
import {
  findCustomers,
  findInvoices,
  findProducts,
  findPurchases,
  findSuppliers,
} from '../repositories/reports.repository.js';

const active = { isDeleted: { $ne: true } };

export const getStockMovementReport = async (query) => {
  const { from, to } = parseRange(query);
  const [products, purchases, invoices] = await Promise.all([
    findProducts(active),
    findPurchases(active),
    findInvoices(active),
  ]);

  return {
    rows: buildStockMovementRows({ products, purchases, invoices, from, to }),
  };
};

const buildPartnerNames = (partners = []) =>
  Object.fromEntries(partners.map((partner) => [partner.id, partner.name]));

export const getStockCard = async (productId, query) => {
  const { from, to } = parseRange(query);
  const [product] = await findProducts({ id: productId });
  if (!product) throw new Error('Product not found');

  const byProduct = { ...active, 'items.productId': productId };
  const [purchases, invoices] = await Promise.all([
    findPurchases(byProduct),
    findInvoices(byProduct),
  ]);
  const [suppliers, customers] = await Promise.all([
    findSuppliers({ id: { $in: purchases.map((doc) => doc.supplierId) } }),
    findCustomers({ id: { $in: invoices.map((doc) => doc.customerId) } }),
  ]);

  return buildStockCard({
    product,
    purchases,
    invoices,
    partnerNames: buildPartnerNames([...suppliers, ...customers]),
    from,
    to,
  });
};
