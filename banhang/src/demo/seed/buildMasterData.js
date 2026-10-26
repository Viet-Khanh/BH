import { SNAPSHOT_DATA_VERSION } from '@backend/utils/snapshotStatus.js';
import { v4 as uuid } from 'uuid';
import { DEMO_SYSTEM_PASSWORD, SEED_DAYS } from '../config.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const buildSettings = (edition, createdAt) => ({
  id: 'main',
  shopName: edition.shop.name,
  shopPhone: edition.shop.phone,
  shopAddress: edition.shop.address,
  sellerTaxCode: edition.shop.taxCode || '',
  allowNegativeStock: false,
  autoUpdateAvgCostOnPurchase: true,
  showSensitiveInfo: false,
  lowStockThreshold: 5,
  printCopies: 1,
  invoiceTemplateHtml: '',
  systemPassword: DEMO_SYSTEM_PASSWORD,
  dataVersion: SNAPSHOT_DATA_VERSION,
  stockDebtSnapshotAt: createdAt,
});

const toProduct = (createdAt, prefix) => (row, index) => {
  const [
    group,
    name,
    unit,
    spec,
    avgCost,
    sellPriceDefault,
    sellPriceWholesale,
    openingStock,
  ] = row;
  return {
    id: uuid(),
    code: `${prefix}${String(index + 1).padStart(3, '0')}`,
    group,
    name,
    unit,
    spec,
    avgCost,
    sellPriceDefault,
    sellPriceWholesale,
    openingStock,
    excludeFromProfit: false,
    note: '',
    createdAt,
  };
};

// Documents for the bulk endpoints plus lookup tables used by the transaction generator.
export const buildMasterData = (edition, now) => {
  const createdAt = new Date(
    now.getTime() - (SEED_DAYS + 1) * DAY_MS
  ).toISOString();
  const customers = edition.customers.map((customer) => ({
    id: uuid(),
    ...customer,
  }));
  const idsWhere = (test) =>
    customers.filter(test).map((customer) => customer.id);

  return {
    settings: buildSettings(edition, createdAt),
    units: edition.units.map((name) => ({
      id: uuid(),
      name,
      note: '',
      createdAt,
    })),
    products: edition.products.map(toProduct(createdAt, edition.codePrefix)),
    customers: customers.map(({ profile: _profile, ...customer }) => customer),
    suppliers: edition.suppliers.map((supplier) => ({
      id: uuid(),
      ...supplier,
    })),
    profileById: Object.fromEntries(
      customers.map((customer) => [customer.id, customer.profile])
    ),
    walkInCustomerId: idsWhere((customer) => customer.profile === 'walkin')[0],
    accountCustomerIds: idsWhere((customer) => customer.profile !== 'walkin'),
    debtorIds: idsWhere((customer) => customer.profile === 'debtor'),
  };
};
