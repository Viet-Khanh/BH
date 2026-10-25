import { getEdition } from '../editions/editionRuntime.js';
import { buildDefaultTemplate } from '../features/settings/templates/defaultInvoiceTemplate.js';

// Function, not a constant: the demo chooses the edition after modules load.
export const getDefaultSettings = () => ({
  id: 'main',
  shopName: getEdition().defaultShopName,
  shopPhone: '0900 000 000',
  shopAddress: '123 Đường ABC, Quận 1',
  allowNegativeStock: false,
  autoUpdateAvgCostOnPurchase: true,
  showSensitiveInfo: false,
  lowStockThreshold: 5,
  printCopies: 1,
  invoiceTemplateHtml: buildDefaultTemplate(),
  dataVersion: 2,
});
