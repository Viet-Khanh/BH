import { getEditionConfig } from '../platform/moduleRuntime.js';
import { EINVOICE_DEFAULT_SETTINGS } from '../features/einvoice/domain/settingsDefaults.js';
import { PRINT_DEFAULT_SETTINGS } from '../features/printing/domain/printSettings.js';
import { buildDefaultTemplate } from '../features/settings/templates/defaultInvoiceTemplate.js';

// Function, not a constant: the demo chooses the edition after modules load.
export const getDefaultSettings = () => ({
  id: 'main',
  shopName: getEditionConfig().defaultShopName,
  shopPhone: '0900 000 000',
  shopAddress: '123 Đường ABC, Quận 1',
  allowNegativeStock: false,
  autoUpdateAvgCostOnPurchase: true,
  showSensitiveInfo: false,
  lowStockThreshold: 5,
  printCopies: 1,
  invoiceTemplateHtml: buildDefaultTemplate(),
  dataVersion: 2,
  ...EINVOICE_DEFAULT_SETTINGS,
  ...PRINT_DEFAULT_SETTINGS,
});
